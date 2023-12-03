# frozen_string_literal: true

require 'http'
require 'json'
require 'yaml'

def fetch_page_data(route)
  matching_pages = $db.col("pages").where("route", "=", route).get
  first_page = matching_pages.first
  if first_page.nil?
    puts "No pages found for route #{route}"
    return nil
  else
    return first_page.data
  end
end

def replace_inherit_values(props_data, page_data)
  return nil if props_data.nil?
  props_data.each do |key, value|
    if value.is_a?(Hash)
      replace_inherit_values(value, page_data)
    elsif value == "__inherit__"
      props_data.store(key, page_data.fetch(key, nil))
    end
  end
  return props_data
end

def get_props_data(id, defaults)
  return nil if id.nil? || id.empty?
  props_col = $db.col("props")
  props_doc = props_col.doc(id).get
  props_data = props_doc.data if props_doc.exists?
  return replace_inherit_values(props_data, defaults)
end

def get_default(type_string)
  case type_string
  when "Array"
    return []
  when "Boolean"
    return nil
  when "String"
    return ""
  when "Hash"
    return {}
  else
    raise "Unknown type: #{type_string}"
  end
end

def render_component(component_name, parent_component_props, inherited_props_data = {})
  locals = {}

  component_props = parent_component_props.fetch(component_name.to_sym, {})
  inherited_component_props = inherited_props_data.fetch(component_name.to_sym, {})

  component_props = replace_inherit_values(component_props, @page_data)
  inherited_component_props = replace_inherit_values(inherited_component_props, @inherited_page_data)

  component_props.merge!(:current_user => @current_user, :session => @session, :breadcrumbs => @breadcrumbs)

  component_template = HTTP.get("https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component_name}.erb").to_s
  metadata_string = component_template[/---(.*?)---/m, 1]

  if metadata_string
    begin
      component_metadata = YAML.load(metadata_string)
      # remove the metadata string from the component template
      component_template.gsub!(/---(.*?)---/m, '')
    rescue
      return "Error parsing metadata for #{component_name}"
    end

    # Extract props from metadata
    component_metadata_props = component_metadata.at(0)

    # Check if component_props_metadata is the props object
    if component_metadata_props.is_a?(Hash) && component_metadata_props.key?("__props__")
      # Convert and Merge props from metadata into component_props
      component_metadata_props["__props__"].each do |key, value|
        unless component_props.has_key?(key.to_sym) && !component_props.fetch(key.to_sym, nil).nil?
          component_props.store(key.to_sym, get_default(value))
        end
      end
      
      # Remove props from component_metadata
      component_metadata.delete_at(0)
    end

    # Iterate through the component metadata
    component_metadata.each do |nested_component|
      component_key = nested_component

      # If the nested component is a Hash, check for the render_if_exists and yield keys
      if nested_component.is_a?(Hash)
        component_key = nested_component.keys.at(0)

        render_if_exists = nested_component.fetch(component_key, {}).fetch("render_if_exists", nil)

        # If render_if_exists is specified, fetch the specified key from the component props
        # If the value is nil or "__inherit__", do not render the component
        if render_if_exists
          render_if_exists = [render_if_exists] unless render_if_exists.is_a?(Array)
          should_render = render_if_exists.all? do |render_if_exists_key|
            component_value = component_props.fetch(component_key.to_sym, {}).fetch(render_if_exists_key.to_sym, nil)
            inherited_component_value = inherited_component_props.fetch(component_key.to_sym, {}).fetch(render_if_exists_key.to_sym, nil)
            render_if_exists_value = component_value || inherited_component_value
            !(render_if_exists_value == "__inherit__" || !render_if_exists_value || (render_if_exists_value.respond_to?(:empty?) && render_if_exists_value.empty?))
          end
          if !should_render
            locals[component_key] = nil
            next
          end
        end

        if nested_component.fetch(component_key, {}).fetch("yield", false)
          replacement_component = component_props.fetch(component_key.to_sym, {})
          locals[component_key] = replacement_component.keys.map do |yielded_component_name|
            # Ignore inherited props if yield is true
            render_component(yielded_component_name, replacement_component, {}).to_s
          end.join
        end
      end

      if !locals[component_key]
        # Shallow merge props
        merged_component_props = inherited_component_props.merge(component_props)
        locals[component_key] = render_component(component_key, merged_component_props, inherited_props_data.fetch(component_key, {})).to_s
      end
    end
  end

  ERB.new(component_template).result_with_hash(component_props.merge(locals))
end
