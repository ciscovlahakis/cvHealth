require "algolia"

AlgoliaClient = Algolia::Search::Client.new(ENV.fetch('ALGOLIA_APPLICATION_ID'), ENV.fetch('ALGOLIA_ADMIN_API_KEY'))
