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
    raise error_message
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

  # Render each component and define a method in the current context
  components = front_matter["components"] || []
  components.each do |component|
    # Fetch and render component
    component_template_content = fetch_template(component)
    _, component_html_content = parse_yaml_front_matter(component_template_content)
    rendered_content = ERB.new(component_html_content).result(binding)

    # Define a method within the current context
    define_singleton_method(component) do
      rendered_content
    end
  end
 
  # Fetch and render the _yield component, if it exists
  if page_data[:_yield]
    yield_component_name = page_data[:_yield]
    yield_component_template = fetch_template(yield_component_name)
    _, yield_component_html_content = parse_yaml_front_matter(yield_component_template)
    _yield_content = ERB.new(yield_component_html_content).result(binding)

    # Define a method for the yield content
    define_singleton_method('_yield') do
      _yield_content
    end
  end
 
   # Render the main template content using the current context
   @html_content = ERB.new(html_content).result(binding)
 
   # Render the final HTML content with the layout
   erb :layout
 end
