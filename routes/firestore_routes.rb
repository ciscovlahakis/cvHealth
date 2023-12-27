# frozen_string_literal: true

before do
  if request.content_type == 'application/json'
    request.body.rewind
    body_content = request.body.read

    # Parse the JSON body
    payload = body_content.empty? ? {} : JSON.parse(body_content)
    @attributes = get_attributes(payload)

    # Validate the parsed data
    is_valid, errors = validate_data(@attributes)

    # Halt the request if validation fails
    halt 422, { errors: errors }.to_json unless is_valid
  end
end

before '/:action/:resource' do
  @resource = params['resource']
end

before '/:action/:resource/:id' do
  @resource = params['resource']
  @id = params['id']
end

get "/firestore_config" do
  begin
    firestore_config = {
      :apiKey => ENV["FIREBASE_API_KEY"],
      :authDomain => ENV["FIREBASE_AUTH_DOMAIN"],
      :databaseURL => ENV["FIREBASE_DATABASE_URL"],
      :projectId => ENV["FIREBASE_PROJECT_ID"],
      :storageBucket => ENV["FIREBASE_STORAGE_BUCKET"],
      :messagingSenderId => ENV["FIREBASE_MESSAGING_SENDER_ID"],
      :appId => ENV["FIREBASE_APP_ID"]
    }
    success_response(firestore_config)
  rescue => e
    error_response(500, e.message)
  end
end

get "/api/collection/:name" do
  begin
    collection_name = params['name']
    field_value = {
      field: params['field'],
      value: params['value']
    }.compact
    data = fetch_document_data(collection_name, field_value.empty? ? nil : field_value)
    success_response(data)
  rescue StandardError => e
    error_response(500, e.message)
  end
end

post "/create/:resource" do
  create_resource(@resource, @attributes)
end

put "/update/:resource/:id" do
  update_resource(@resource, @attributes, @id, full_update: true)
end

patch "/update/:resource/:id" do
  update_resource(@resource, @attributes, @id)
end

post "/delete/:resource" do
  delete_resource(@resource, @id)
end

post "/update_position" do
  begin
    new_position = params.fetch("position").to_i
    ref = $db.col(@resource).doc(@id)
    ref.set({ position: new_position }, merge: true)
    success_response({ status: "success" })
  rescue JSON::ParserError
    error_response(400, "Invalid JSON")
  rescue StandardError => e
    error_response(500, e.message)
  end
end
