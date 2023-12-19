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

def publish_event(hash, doc, event)
  json_data = JSON.generate(hash) if hash && !hash.empty?
  # Directly embed the JSON data into a script tag within the HTML
  if json_data
    script_tag = <<-SCRIPT
      <script type='text/javascript'>
        document.addEventListener('DOMContentLoaded', function() {
          PubSub.publish(window.EVENTS['#{event}'], {
            action: 'create',
            data: JSON.parse(#{json_data.inspect})
          });
        });
      </script>
    SCRIPT
    # Create a Nokogiri fragment for the script tag
    script_fragment = Nokogiri::HTML::DocumentFragment.parse(script_tag)
    # Prepend the script fragment to the fragment_doc
    doc.children.before(script_fragment)
  end
end

def render_fragment(fragment_name)
  fragment_content = fetch_template(fragment_name)

  return nil unless fragment_content

  rendered_fragment_content = ERB.new(fragment_content).result(binding)

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

    # # Parse the props from the data-props attribute
    # props_json = parent_placeholder['data-props']
    # nested_props = props_json ? JSON.parse(props_json) : {}

    # # Merge the page data with the nested props
    # nested_page_data = page_data.merge(nested_props)

    # Render nested components within the fragment using the merged data
    nested_fragment_data = render_fragment(nested_component_name)
    next if nested_fragment_data.nil?

    # Extract the HTML content from the nested fragment data
    nested_content_html = nested_fragment_data

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

  # Convert the YAML front matter to JSON
  publish_event(fragment_front_matter, fragment_doc, 'FRAGMENT_SINGULAR_CHANGED')

  # Include a script tag to load the corresponding JS file for the fragment, if it exists
  js_file_path = "./public/gcs/#{fragment_name}.js"
  if File.exist?(js_file_path)
    script_tag = "<script src='#{js_file_path}'></script>"
    # Create a Nokogiri fragment for the script tag
    script_fragment = Nokogiri::HTML::DocumentFragment.parse(script_tag)
    # Prepend the script tag fragment to the fragment_doc
    fragment_doc.children.before(script_fragment)
  end

  # Return only the fully rendered fragment content
  fragment_doc.to_html
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

  # Render ERB and extract YAML front matter and the HTML content
  rendered_template_content = ERB.new(template_content).result(binding)
  front_matter, html_content = parse_yaml_front_matter(rendered_template_content)

  # Parse the main HTML content with Nokogiri
  doc = Nokogiri::HTML::DocumentFragment.parse(html_content)

  # Convert the YAML front matter to JSON
  publish_event(page_data, doc, 'PAGE_SINGULAR_CHANGED')

  # Prepare the components array
  components = front_matter.fetch("components", [])
  _yield_component_name = page_data.fetch(:_yield, nil)
  components << _yield_component_name unless _yield_component_name.nil?

  # Render components and replace placeholders
  components.each do |component_name|
    component_template_content = fetch_template(component_name)
    next unless component_template_content

    # Render ERB and parse YAML front matter
    rendered_component_content = ERB.new(component_template_content).result(binding)
    component_front_matter, component_html_content = parse_yaml_front_matter(rendered_component_content)

    # Convert the YAML front matter to JSON
    publish_event(component_front_matter, doc, 'COMPONENT_SINGULAR_CHANGED')
    
    # Process any fragments associated with the component
    fragment_file_names = component_front_matter.fetch("fragments", [])
    fragment_file_names.each do |fragment_file_name|
      render_fragment(fragment_file_name)
    end

    placeholder = doc.at("div[data-component='#{component_name}']")
    placeholder = doc.at("div[data-component='_yield']") if component_name == _yield_component_name
    next unless placeholder

    rendered_content = ERB.new(component_html_content).result(binding)

    # Replace the placeholder in the main document with the rendered content
    placeholder.replace(Nokogiri::HTML::DocumentFragment.parse(rendered_content))
  end

  # After replacing all placeholders, convert the Nokogiri document back to HTML
  html_content_with_components = doc.to_html

  # Final rendering of the page
  @html_content = ERB.new(html_content_with_components).result(binding)

  # Render the final HTML content with the layout
  erb :layout
end
