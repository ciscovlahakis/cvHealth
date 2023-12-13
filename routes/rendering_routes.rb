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

get "/*" do |path|
  # Fetch the page data from Firestore
  page_data = fetch_page_data("/#{path}")
  return halt(404, "Page not found") if page_data.nil?

  # Extract the template name from the page data
  template_name = page_data.fetch(:template, nil)
  return halt(404, "Template not specified") if template_name.nil?

  # Fetch the template content from GCS
  template_content = fetch_template(template_name)
  return halt(404, "Template content not found") if template_content.nil?

  # Extract YAML front matter and the HTML content
  front_matter, html_content = parse_yaml_front_matter(template_content)

  # Initialize the component_properties and fragments_data hashes
  component_properties = {}
  fragments_data = {}
  @component_scripts = []

  # Prepare the components array
  components = front_matter.fetch("components", [])
  _yield_component_name = page_data.fetch(:_yield, nil)
  components << _yield_component_name unless _yield_component_name.nil?

  # First loop to collect properties for all components
  components.each do |component_name|
    component_template_content = fetch_template(component_name)
    next unless component_template_content
    component_front_matter, _ = parse_yaml_front_matter(component_template_content)

    # Store the component's properties in the component_properties hash
    component_properties.store(component_name, component_front_matter)

    # Process any fragments associated with the component
    fragment_file_names = component_front_matter.fetch("fragments", [])
    fragment_file_names.each do |fragment_file_name|
      fragment_content = fetch_template(fragment_file_name)
      next unless fragment_content
      fragment_front_matter, fragment_html_content = parse_yaml_front_matter(fragment_content)
    
      # Process nested components within the fragment
      nested_components = fragment_front_matter.fetch("components", [])
      nested_components.each do |nested_component_name|
        nested_component_template_content = fetch_template(nested_component_name)
        next unless nested_component_template_content
        _, nested_component_html_content = parse_yaml_front_matter(nested_component_template_content)

        # Prepare the Nokogiri document for the nested component
        nested_doc = Nokogiri::HTML::DocumentFragment.parse(nested_component_html_content)
        nested_placeholder = nested_doc.at("div[data-yield]")
      
        # Check for nested content within the parent component's placeholder
        fragment_doc = Nokogiri::HTML::DocumentFragment.parse(fragment_html_content)
        parent_placeholder = fragment_doc.at("div[data-component='#{nested_component_name}']")
      
        # If nested content exists, extract it
        child_content = parent_placeholder.inner_html if parent_placeholder && !parent_placeholder.inner_html.strip.empty?
      
        # Render the nested component with any child content
        rendered_nested_component = if nested_placeholder && child_content
                                      # Replace the placeholder in the nested component with the child content
                                      nested_placeholder.inner_html = child_content
                                      nested_doc.to_html
                                    else
                                      # No nested content; render the component as it is
                                      ERB.new(nested_component_html_content).result(binding)
                                    end
      
        # Replace the placeholder for the nested component in the parent's content
        parent_placeholder.inner_html = rendered_nested_component if parent_placeholder
      
        # Update the fragment_html_content with the modified document
        fragment_html_content = fragment_doc.to_html

        @component_scripts << nested_component_name if File.exist?("./public/gcs/#{nested_component_name}.js")
      end
      
      # Store the fully rendered fragment content
      fragments_data.store(fragment_file_name, {
        :title => fragment_front_matter["title"],
        :content => fragment_html_content
      })
      @component_scripts << fragment_file_name if File.exist?("./public/gcs/#{fragment_file_name}.js")
    end
  end

  # Parse the main HTML content with Nokogiri
  doc = Nokogiri::HTML::DocumentFragment.parse(html_content)

  # Second loop to render components and replace placeholders
  components.each do |component_name|
    component_template_content = fetch_template(component_name)
    next unless component_template_content
    _, component_html_content = parse_yaml_front_matter(component_template_content)

    placeholder = doc.at("div[data-component='#{component_name}']")
    placeholder = doc.at("div[data-component='_yield']") if component_name == _yield_component_name
    next unless placeholder

    rendered_content = if placeholder.inner_html.strip.empty?
                         # No nested content, render the component as childless
                         ERB.new(component_html_content).result(binding)
                       else
                         # Nested content found, treat the component as a parent
                         component_doc = Nokogiri::HTML::DocumentFragment.parse(component_html_content)
                         yieldable_area = component_doc.at('div[data-yield]')
                         yieldable_area.inner_html = placeholder.inner_html # Only replace the inner content
                         rendered_content = component_doc.to_html
                       end

    # Replace the placeholder inner in the main document with the rendered content
    placeholder.inner_html = rendered_content if placeholder
    @component_scripts << component_name if File.exist?("./public/gcs/#{component_name}.js")
  end

  # After replacing all placeholders, convert the Nokogiri document back to HTML
  html_content_with_components = doc.to_html

  # Final rendering of the page
  @html_content = ERB.new(html_content_with_components).result(binding)

  @component_scripts.uniq!

  # Render the final HTML content with the layout
  erb :layout
end
