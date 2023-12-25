# frozen_string_literal: true

require "sinatra/reloader"
require 'erb'

get "/favicon.ico" do
end

get "/__sinatra__" do
end

get "/__sinatra__500.png" do
end

# Serve individual components
get "/components/:component_name" do
  component_name = params.fetch("component_name")
  content = get_rendered_content(component_name)

  json_response = {
    "html_content" => content[:html_content],
    "front_matter" => content[:front_matter]
  }.to_json

  content_type :json
  json_response
end

# Serve main page
get "/*" do |path|
  # Handle the request for a static file
  if path.start_with?("public/gcs/")
    file_path = path.sub(/^public\/gcs\//, '') # Remove the leading 'public/gcs/' from the path
    file_full_path = File.join(settings.public_folder, 'gcs', file_path)

    if File.exist?(file_full_path) && File.file?(file_full_path)
      send_file(file_full_path)
    else
      halt(404, "File not found")
    end
  end

  page_data = fetch_document_data("pages", {:field => "route", :value => "/#{path}"})
  return halt(404, "Page not found").tap {
    logger.error "No page data found for route: /#{path}"
  } if page_data.nil?

  template_name = page_data.fetch(:template, nil)
  return halt(404, "Template not specified").tap {
    logger.error "No template found: #{template_name}"
  } if template_name.nil?

  content = get_rendered_content(template_name)
  template = content[:html_content]
  front_matter = content[:front_matter]
  front_matter = page_data.merge(front_matter).to_json

  erb :layout, :locals => {
    :template => template,
    :front_matter => front_matter
  }
end
