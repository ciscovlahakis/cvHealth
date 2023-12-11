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

  # Initialize the resource_properties hash
  resource_properties = {}

  # Initialize the fragments_data hash
  fragments_data = {}

  # Prepare the components array, including _yield if it exists
  components = front_matter.fetch("components", [])
  _yield_component_name = page_data.fetch(:_yield, nil)
  components << _yield_component_name unless _yield_component_name.nil?

  # Loop to collect properties for all components, including _yield
  components.each do |component|
    # Fetch component template content
    component_template_content = fetch_template(component)
    next unless component_template_content
    component_front_matter, component_html_content = parse_yaml_front_matter(component_template_content)

    # Store the component's properties in the resource_properties hash
    resource_properties.store(component, component_front_matter)

    fragment_file_names = component_front_matter.fetch("fragments", [])
    # Fetch the content of each fragment
    fragment_file_names.each do |fragment_file_name|
      fragment_content = fetch_template(fragment_file_name)
      next unless fragment_content
      fragment_front_matter, fragment_html_content = parse_yaml_front_matter(fragment_content)
      # Store the fragment's content in the fragments_data hash
      fragments_data.store(fragment_file_name, {
        :title => fragment_front_matter["title"],
        :content => fragment_html_content
      })
    end
  end

  # Render components with the full resource_properties context
  components.each do |component|
    # Fetch component template content again
    _, component_html_content = parse_yaml_front_matter(fetch_template(component))

    # Render the component with access to the resource_properties hash
    rendered_content = ERB.new(component_html_content).result(binding)

    # Define a method within the current context
    define_singleton_method(component) do
      rendered_content
    end
  end

  # Special handling for _yield to replace it with the specified component content
  if _yield_component_name
    define_singleton_method('_yield') do
      send(_yield_component_name)
    end
  end

  # Parse the main HTML content and look for placeholders
  doc = Nokogiri::HTML(html_content)
  doc.css('div[data-component]').each do |placeholder|
    component_name = placeholder['data-component']
    
    # Check if the component method is defined
    if respond_to?(component_name)
      # Replace the placeholder div with the rendered component content
      placeholder.replace(Nokogiri::HTML::DocumentFragment.parse(send(component_name)))
    else
      puts "Component method not defined for: #{component_name}"
    end
  end

  # After replacing all placeholders, convert the Nokogiri document back to HTML
  html_content_with_components = doc.to_html

  # Render the main template content using the current context
  @html_content = ERB.new(html_content_with_components).result(binding)

  # Render the final HTML content with the layout
  erb :layout
end

# get "/*" do |path|
#   erb :layout
# end
