# frozen_string_literal: true

require "sinatra/reloader"
require 'erb'

get "/favicon.ico" do
end

get "/__sinatra__" do
end

get "/__sinatra__500.png" do
end

def fetch_page_data(route)
  matching_pages = $db.col("pages").where("route", "=", route).get
  first_page = matching_pages.first
  if first_page.nil?
    puts "PAGE NOT FOUND FOR: #{route}"
    return nil
  else
    return first_page.data
  end
end

# Fetch the template from Google Cloud Storage
def fetch_template(component_name)
  response = HTTP.get("https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component_name}.erb")
  if response.status.success?
    return response.to_s
  else
    error_message = "Failed to fetch template: #{response.status}"
    puts error_message
  end
end

# Parse the YAML front matter from the template
def parse_yaml_front_matter(template_content)
  # Check if the file starts with the YAML front matter delimiter '---'
  if template_content.strip.start_with?("---")
    # Split on the YAML delimiters, ignoring the first split which is empty
    front_matter, content = template_content.split(/---\s*/, 3)[1..]
    parsed_front_matter = YAML.load(front_matter)
    [parsed_front_matter, content.strip]
  else
    # If there is no YAML front matter, return an empty front matter and the whole content
    [{}, template_content.strip]
  end
end

get "/*" do |path|
  # Fetch the page data from Firestore
  page_data = fetch_page_data("/#{path}")

  # Extract the template name from the page data
  template_name = page_data.fetch(:template, nil)
  if template_name.nil?
    puts "Template name not specified in page data for path: #{path}"
    halt 404, "Template not specified"
  end

  # Fetch the template content from GCS
  template_content = fetch_template(template_name)

  # Extract YAML front matter and the HTML content
  front_matter, html_content = parse_yaml_front_matter(template_content)

  # Initialize the resource_properties hash
  resource_properties = {}

  # Initialize the fragments_data hash
  fragments_data = {}

  # Prepare the components array, including _yield if it exists
  components = front_matter.fetch("components", [])
  _yield_component_name = page_data.fetch(:_yield, nil)
  components << _yield_component_name unless !_yield_component_name

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
      fragments_data[fragment_file_name] = {
        :title => fragment_front_matter["title"],
        :content => fragment_html_content
      }
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

  # Render the main template content using the current context
  @html_content = ERB.new(html_content).result(binding)

  # Render the final HTML content with the layout
  erb :layout
end

# get "/*" do |path|
#   erb :layout
# end
