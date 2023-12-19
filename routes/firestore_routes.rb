# frozen_string_literal: true

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
    content_type :json
    return firestore_config.to_json
  rescue => e
    content_type :json
    status 500
    return { :error => e.message }.to_json
  end
end

get "/api/collection/:name" do
  content_type :json

  collection_name = params['name']
  field_value = {
    :field => params['field'],
    :value => params['value']
  }.compact

  data = fetch_document_data(collection_name, field_value.empty? ? nil : field_value)
  data.to_json
end

post "/create/:resource" do
  begin
    request.body.rewind
    request_payload = JSON.parse(request.body.read)
    resource = params.fetch("resource")
    attributes = request_payload
    create_item(resource, attributes)
  rescue JSON::ParserError
    status 400
    content_type :json
    return { :error => "Invalid JSON" }.to_json
  rescue StandardError => e
    status 500
    content_type :json
    return { :error => e.message }.to_json
  end
end

post "/update/:resource" do
  resource, attributes = resource_and_attributes()
  id = params.fetch("id")  # Fetch the existing document's id from params
  updated_item = attributes.each_with_object({}) do |attribute, hash|
    attribute_id = attribute.fetch(:id)
    if attribute.fetch(:type) == Integer
      hash[attribute_id] = params.fetch(attribute_id, "").to_i
    else
      hash[attribute_id] = params.fetch(attribute_id, "")
    end
  end
  collection_ref = $db.col(resource).doc(id)  # Pass the existing document's id to doc(id)
  collection_ref.set(updated_item)
  redirect "/#{resource}"
end

post "/delete/:resource" do
  resource = params.fetch("resource")
  id = params.fetch("id")
  ref = $db.col(resource).doc(id)
  ref.delete
  redirect "/#{resource}"
end

post "/update_position" do
  id = params.fetch("id")
  new_position = params.fetch("position").to_i
  resource = params.fetch("resource")
  ref = $db.col(resource).doc(id)
  ref.set({ :position => new_position }, merge: true)
  return { :status => "success" }.to_json
end
