# frozen_string_literal: true

require "sinatra/reloader"
require 'erb'
require 'nokogiri'

get "/favicon.ico" do
end

get "/__sinatra__" do
end

get "/__sinatra__500.png" do
end

# get "/*" do |path|
#   erb :layout
# end

def render_fragment(fragment_name, fetch_template, component_scripts, page_data)
  fragment_content = fetch_template.call(fragment_name)
  return nil unless fragment_content

  # Ensure collection_config is available for the ERB context
  collection_name = page_data.fetch(:collection, nil)
  collection_config = fetch_document_data("collections", {:field => "name", :value => collection_name}) if collection_name

  # Render the fragment content with ERB
  erb_binding = binding
  page_data.each do |key, value|
    erb_binding.local_variable_set(key.to_sym, value) if key.is_a?(String)
  end

  # Render the fragment content with ERB
  rendered_fragment_content = ERB.new(fragment_content).result(erb_binding)

  # Parse the YAML front matter and the HTML content
  fragment_front_matter, fragment_html_content = parse_yaml_front_matter(rendered_fragment_content)

  # Prepare the Nokogiri document for the fragment
  fragment_doc = Nokogiri::HTML::DocumentFragment.parse(fragment_html_content)

  # Process nested components
  nested_components = fragment_front_matter.fetch("components", [])
  nested_components.each do |nested_component_name|
    # Find the placeholder for the nested component in the parent fragment
    parent_placeholder = fragment_doc.at("div[data-component='#{nested_component_name}']")
    # Skip if no placeholder is found
    next unless parent_placeholder

    # Parse the props from the data-props attribute
    props_json = parent_placeholder['data-props']
    nested_props = props_json ? JSON.parse(props_json) : {}

    # Merge the page data with the nested props
    nested_page_data = page_data.merge(nested_props)

    # Render nested components within the fragment using the merged data
    nested_fragment_data = render_fragment(nested_component_name, fetch_template, component_scripts, nested_page_data)
    next if nested_fragment_data.nil?

    # Extract the HTML content from the nested fragment data
    nested_content_html = nested_fragment_data[:content]

    # Prepare the Nokogiri document for the nested component
    nested_doc = Nokogiri::HTML::DocumentFragment.parse(nested_content_html)
    nested_placeholder = nested_doc.at("div[data-yield]")

    # If nested content exists within the parent placeholder, extract it
    child_content = parent_placeholder.inner_html unless parent_placeholder.inner_html.strip.empty?

    # Render the nested component, replacing the placeholder if necessary
    rendered_nested_component = if nested_placeholder && child_content
                                  nested_placeholder.inner_html = child_content
                                  nested_doc.to_html
                                else
                                  nested_content_html
                                end

    # Replace the placeholder in the parent fragment with the rendered nested component
    parent_placeholder.replace(Nokogiri::HTML::DocumentFragment.parse(rendered_nested_component))
  end

  # Add any component-specific scripts to the list
  component_scripts << fragment_name if File.exist?("./public/gcs/#{fragment_name}.js")

  # Return the fully rendered fragment content along with any fetched title
  {:title => fragment_front_matter["title"], :content => fragment_doc.to_html}
end

get "/*" do |path|
  # Fetch the page data from Firestore
  page_data = fetch_document_data("pages", {
    :field => "route",
    :value => "/#{path}"
  })
  return halt(404, "Page not found") if page_data.nil?

  # Extract the template name from the page data
  template_name = page_data.fetch(:template, nil)
  return halt(404, "Template not specified") if template_name.nil?

  # Fetch the template content from GCS
  template_content = fetch_template(template_name)
  return halt(404, "Template content not found") if template_content.nil?

  # Fetch the collection configuration if needed
  collection_name = page_data.fetch(:collection, nil)
  collection_config = fetch_document_data("collections", {
    :field => "name",
    :value => collection_name
  }) if collection_name

  # Render ERB and extract YAML front matter and the HTML content
  rendered_template_content = ERB.new(template_content).result(binding)
  front_matter, html_content = parse_yaml_front_matter(rendered_template_content)

  @component_scripts = []
  component_properties = {}
  fragments_data = {}

  # Prepare the components array
  components = front_matter.fetch("components", [])
  _yield_component_name = page_data.fetch(:_yield, nil)
  components << _yield_component_name unless _yield_component_name.nil?

  # First loop to collect properties for all components
  components.each do |component_name|
    component_template_content = fetch_template(component_name)
    next unless component_template_content

    # Render ERB and parse YAML front matter
    rendered_component_content = ERB.new(component_template_content).result(binding)
    component_front_matter, _ = parse_yaml_front_matter(rendered_component_content)

    # Store the component's properties in the component_properties hash
    component_properties.store(component_name, component_front_matter)

    # Process any fragments associated with the component
    fragment_file_names = component_front_matter.fetch("fragments", [])
    fragment_file_names.each do |fragment_file_name|
      fragment_data = render_fragment(fragment_file_name, method(:fetch_template), @component_scripts, page_data)
      # Store the fully rendered fragment content if it exists
      if fragment_data
        fragments_data.store(fragment_file_name, fragment_data)
      end
    end
  end

  # Parse the main HTML content with Nokogiri
  doc = Nokogiri::HTML::DocumentFragment.parse(html_content)

  # Second loop to render components and replace placeholders
  components.each do |component_name|
    component_template_content = fetch_template(component_name)
    next unless component_template_content

    # Render ERB and parse YAML front matter
    rendered_component_content = ERB.new(component_template_content).result(binding)
    _, component_html_content = parse_yaml_front_matter(rendered_component_content)

    placeholder = doc.at("div[data-component='#{component_name}']")
    placeholder = doc.at("div[data-component='_yield']") if component_name == _yield_component_name
    next unless placeholder

    rendered_content = ERB.new(component_html_content).result(binding)
    # Replace the placeholder in the main document with the rendered content
    placeholder.replace(Nokogiri::HTML::DocumentFragment.parse(rendered_content))
    @component_scripts << component_name if File.exist?("./public/gcs/#{component_name}.js")
  end

  # After replacing all placeholders, convert the Nokogiri document back to HTML
  html_content_with_components = doc.to_html

  # Final rendering of the page
  @html_content = ERB.new(html_content_with_components).result(binding)

  @component_scripts.uniq!

  @fragments_data = fragments_data

  # Render the final HTML content with the layout
  erb :layout
end
