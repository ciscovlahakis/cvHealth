# frozen_string_literal: true

require "sinatra/reloader"

get '/favicon.ico' do
end

get '/__sinatra__' do
end

get '/__sinatra__500.png' do
end

get '/move/:src/:dest' do
  move(params[:src], params[:dest])
end

get '/html/:name' do
  component_name = params[:name]
  content_type :text
  get_html(component_name)
end

get '/db/:coll/:field/:value' do
  coll_name = params[:coll]
  field = params[:field]
  value = params[:value]

  if value == "SLASH"
    value = '/'
  end

  doc_data = fetch_doc_data(coll_name, {field: field, value: value})

  if doc_data.nil?
    halt(404, "Doc not found").tap {
      logger.error "No data found for #{coll_name} with #{field}: #{value}"
    }
  end

  content_type :json
  doc_data.to_json
end

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
  erb :layout
end
