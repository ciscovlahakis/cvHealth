# frozen_string_literal: true

post "/upload" do
  # Get the file from the request
  file = params.fetch("file")

  # Create a unique filename
  filename = file[:filename]

  storage = Google::Cloud::Storage.new
  bucket = storage.bucket "cisco-vlahakis.appspot.com"

  # Specify the Cache-Control metadata
  cache_control = "no-cache, no-store, must-revalidate"

  # Upload the file to GCS
  gcs_file = bucket.create_file(file[:tempfile], filename, cache_control: cache_control, acl: "publicRead")

  # Get the public URL of the file
  url = gcs_file.public_url

  # Add a new document to Firestore with the URL
  x = "components"
  doc_ref = $db.doc("#{x}/#{filename}")
  doc_ref.set({ url: url })

  # Redirect to the home page
  redirect back
end
