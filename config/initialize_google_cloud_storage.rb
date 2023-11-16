require "google/cloud/storage"

Google::Cloud::Storage.configure do |config|
  config.project_id  = ENV["GOOGLE_PROJECT_ID"]
  if ENV["GOOGLE_APPLICATION_CREDENTIALS"]
    config.credentials = JSON.parse(ENV["GOOGLE_APPLICATION_CREDENTIALS"])
  end
end
