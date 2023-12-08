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
  route_components = route == "/" ? [""] : ["/"] + route.split("/")[1..]

  @breadcrumbs = []
  html_content = ""

  route_components.each_with_index do |component, index|
    breadcrumb_route = route_components[0..index].join("")
    breadcrumb_route = "/" if breadcrumb_route == ""

    @page_data = fetch_page_data(breadcrumb_route)
    next if breadcrumb_route.nil? || @page_data.nil?

    breadcrumb = {
      "title": @page_data.fetch(:title, nil),
      "icon": @page_data.fetch(:icon, nil),
      "img_src": @page_data.fetch(:img_src, nil),
      "route": @page_data.fetch(:route, nil)
    }

    @breadcrumbs.push(breadcrumb)
    
    if breadcrumb_route == route
      current_props_data = get_props_data(@page_data.fetch(:props, ''), @page_data)

      inherits_from = @page_data.fetch(:inherits_from, nil)
      @inherited_page_data = {}
      inherited_props_data = {}

      if inherits_from
        @inherited_page_data = fetch_page_data(inherits_from)
        break if !@inherited_page_data
        inherited_props_data = get_props_data(@inherited_page_data.fetch(:props, ''), @inherited_page_data)
      end

      if @page_data && current_props_data
        html_content = render_component(current_props_data.keys.at(0), current_props_data, inherited_props_data)
      end
    end
  end

  erb :page, :locals => { :html_content => html_content }
end
