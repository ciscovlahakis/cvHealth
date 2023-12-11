# frozen_string_literal: true

require 'http'
require 'json'
require 'yaml'
 
def get_data(id, col)
  return nil if id.nil? || id.empty?
  _col = $db.col(col)
  _doc = _col.doc(id).get
  _data = _doc.data if _doc.exists?
  return _data
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
