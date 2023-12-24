# frozen_string_literal: true

require 'http'
require 'json'
require 'yaml'
require 'securerandom'

def generate_random_id
  SecureRandom.hex(10) # Generates a random hex string of length 20
end

def get_rendered_content(template_name)
  template_content = fetch_template(template_name)
  if template_content.nil?
    halt(404, "Template content not found").tap {
      logger.error "No template content found for template: #{template_name}"
    }
  end

  front_matter, html_content = parse_yaml_front_matter(template_content)
  rendered_html_content = ERB.new(html_content).result(binding)

  return {
    :html_content => rendered_html_content,
    :front_matter => front_matter
  }
end
 
# Fetch the template from Google Cloud Storage
def fetch_template(component_name)
  url = "https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component_name}.erb"
  response = HTTP.get(url)

  if response.status.success?
    return response.to_s
  elsif response.status.code == 403
    puts "Access to the template is forbidden. Check permissions."
    # Implement logic to refresh the authentication token or credentials if possible
  else
    puts "Failed to fetch template: #{response.status}"
  end
  nil
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
