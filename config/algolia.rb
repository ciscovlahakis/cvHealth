require "algoliasearch"

AlgoliaClient = Algolia::Client.new({ :application_id => ENV.fetch('ALGOLIA_APPLICATION_ID'), :api_key => ENV.fetch('ALGOLIA_ADMIN_API_KEY') })
