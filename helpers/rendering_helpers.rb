# frozen_string_literal: true

require 'http'
require 'json'
require 'yaml'
 
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

def get_data(id, col)
  return nil if id.nil? || id.empty?
  _col = $db.col(col)
  _doc = _col.doc(id).get
  _data = _doc.data if _doc.exists?
  return _data
end

def build_components_structure(component_data)
  # If the component_data has a direct 'components' key, return its value

  if component_data.key?(:components)
    return component_data.fetch(:components)
  
  # If the component_data has a 'componentId', fetch the related component
  elsif component_data.key?(:componentId)
    nested_component_data = get_data(component_data.fetch(:componentId), "components")
    
    if nested_component_data
      # If the fetched component has its own 'components' key, build the structure from it
      if nested_component_data.key?(:components)
        nested_structure = nested_component_data.fetch(:components)
      
      # If the fetched component has another 'componentId', recursively resolve it
      elsif nested_component_data.key?(:componentId)
        nested_structure = build_components_structure(nested_component_data)
      end
      
      # If the original component_data has a '_yield', replace it in the nested structure
      if component_data.key?(:_yield) && nested_structure
        yield_content = component_data.fetch(:_yield)
        return replace_yield(nested_structure, yield_content)
      else
        # If there's no '_yield', return the nested structure as is
        return nested_structure
      end
    else
      # If no data is found for the nested component, return an empty array
      return []
    end
  else
    # If neither 'components' nor 'componentId' keys exist, return an empty array
    return []
  end
end

def replace_yield(structure, yield_content)
  structure.map do |row|
    if row[:row].is_a?(Array) # Check if the row contains multiple components
      # Replace "_yield" with yield_content in the array of components
      components = row[:row].map { |component| component == "_yield" ? yield_content : component }
      { :row => components }
    else
      # Replace "_yield" with yield_content if the single component matches
      component = row[:row] == "_yield" ? yield_content : row[:row]
      { :row => component }
    end
  end
end

def parse_template_with_front_matter(template_content)
  if template_content.start_with?("---")
    front_matter_end = template_content.index("---", 3)
    front_matter_yaml = template_content[3...front_matter_end].strip
    front_matter_data = YAML.load(front_matter_yaml)
    template_content = template_content[(front_matter_end+3)..-1]
  else
    front_matter_data = {}
  end
  
  return template_content, front_matter_data
end

def collect_component_properties(structure)
  structure.each do |component_struct|
    components = component_struct.fetch(:row)
    components = [components] unless components.is_a?(Array)

    components.each do |component|
      _, component_properties = fetch_component_properties(component)
      @all_component_properties.merge!(component_properties) { |key, oldval, newval| [oldval, newval].flatten.uniq }
    end
  end
end

def fetch_component_properties(component)
  response = HTTP.get("https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component}.erb")
  template_content, front_matter_data = parse_template_with_front_matter(response.to_s)
  return template_content, { component => front_matter_data }
end

def render_html_from_structure(structure)
  html_content = "<div class='container'>"

  structure.each do |component_struct|
    components = component_struct.fetch(:row)

    if components.is_a?(Array)
      html_content += "<div class='row'>"
      components.each do |component|
        component_html = render_component_html(component)
        html_content += component_html
      end
      html_content += "</div>" # Close the row div
    else
      component_html = render_component_html(components)
      html_content += component_html
    end
  end

  html_content += "</div>" # Close the container div
  return html_content
end

def render_component_html(component)
  response = HTTP.get("https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component}.erb")
  template_content, _ = parse_template_with_front_matter(response.to_s)

  page_data = @page_data
  all_component_properties = @all_component_properties
  erb_result = ERB.new(template_content).result(binding)
  return erb_result
end
