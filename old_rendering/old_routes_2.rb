# frozen_string_literal: true

require "sinatra/reloader"
require 'erb'

get "/favicon.ico" do
end

get "/__sinatra__" do
end

get "/__sinatra__500.png" do
end

get "/*" do
  route = request.path_info
  @page_data = fetch_page_data(route)

  @all_component_properties = {}
  html_content = "<p>PAGE NOT FOUND</p>"

  if @page_data
    component_structure = build_components_structure(@page_data)

    # Collect all properties before rendering components
    collect_component_properties(component_structure)
    
    # Now render the components with the complete all_component_properties
    html_content = render_html_from_structure(component_structure)
  end

  # Render the layout template with the full all_component_properties
  erb :layout, locals: {
    :content => html_content,
    :page_data => @page_data,
    :all_component_properties => @all_component_properties
  }
end
