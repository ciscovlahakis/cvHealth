# frozen_string_literal: true

get '/firestore_config' do
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

get("/collection") do
  # Get a reference to your items collection
  collection_ref = $db.col 'collection'
  # Get all documents in the collection
  items = collection_ref.get

  # Format the data as an array of hashes
  formatted_items = items.map do |item|
    item.data.merge({ :id => item.document_id })
  end

  content_type :json
  return formatted_items.to_json
end
