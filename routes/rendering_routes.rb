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
      fragments_data.store(fragment_file_name, {
        :title => fragment_front_matter["title"],
        :content => fragment_html_content
      })
    end
  end

  # Parse the main HTML content with Nokogiri
  doc = Nokogiri::HTML(html_content)

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
                         component_doc = Nokogiri::HTML(component_html_content)
                         yieldable_area = component_doc.at('div[data-yield]') # Adjust this selector based on your HTML structure
                         yieldable_area.replace(placeholder.inner_html)
                         component_doc.to_html
                       end

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

# get "/*" do |path|
#   erb :layout
# end
