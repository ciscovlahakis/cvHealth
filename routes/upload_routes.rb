# frozen_string_literal: true

post "/upload" do
  # Assuming 'file' is the name attribute in the form for the input file
  unless params.fetch("file") && (tempfile = params.fetch("file")[:tempfile]) && (filename = params.fetch("file")[:filename])
    status 400 # Bad Request
    return {:error => "No file uploaded"}.to_json
  end

  # Create a unique filename
  # filename = SecureRandom.uuid + File.extname(params.fetch("file")[:filename])

  storage = Google::Cloud::Storage.new
  bucket = storage.bucket("cisco-vlahakis.appspot.com")

  # Specify the Cache-Control metadata
  cache_control = "no-cache, no-store, must-revalidate"

  # Upload the file to GCS
  begin
    gcs_file = bucket.create_file(tempfile.path, filename, cache_control: cache_control, acl: "publicRead")

    # Get the public URL of the file
    url = gcs_file.public_url

    # Add a new document to Firestore with the URL
    x = "components"
    doc_ref = $db.doc("#{x}/#{filename}")
    doc_ref.set({:url => url})

    # Respond with a JSON object containing the URL
    status 200 # OK
    return {:status => "success", :url => url}.to_json
  rescue => e
    status 500 # Internal Server Error
    return {:error => e.message}.to_json
  end
end
