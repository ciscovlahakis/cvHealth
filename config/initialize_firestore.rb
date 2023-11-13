require 'google/cloud/firestore'

# Configure the Google Cloud Firestore gem with the environment variables
Google::Cloud::Firestore.configure do |config|
  config.project_id  = ENV.fetch('GOOGLE_PROJECT_ID')
  config.credentials = {
    :type => ENV.fetch('GOOGLE_TYPE'),
    :project_id => ENV.fetch('GOOGLE_PROJECT_ID'),
    :private_key_id => ENV.fetch('GOOGLE_PRIVATE_KEY_ID'),
    :private_key => ENV.fetch('GOOGLE_PRIVATE_KEY'),
    :client_email => ENV.fetch('GOOGLE_CLIENT_EMAIL'),
    :client_id => ENV.fetch('GOOGLE_CLIENT_ID'),
    :auth_uri => ENV.fetch('GOOGLE_AUTH_URI'),
    :token_uri => ENV.fetch('GOOGLE_TOKEN_URI'),
    :auth_provider_x509_cert_url => ENV.fetch('GOOGLE_AUTH_PROVIDER_X509_CERT_URL'),
    :client_x509_cert_url => ENV.fetch('GOOGLE_CLIENT_X509_CERT_URL')
  }
end

# Initialize the Firestore client
firestore = Google::Cloud::Firestore.new
