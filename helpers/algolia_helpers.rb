# frozen_string_literal: true

helpers do
  def search(term, priority_module = nil)
    term = params.fetch("term")
    priority_module = request.path
  
    algolia = Algolia::Client.new({ :application_id => ENV["ALGOLIA_APPLICATION_ID"], :api_key => ENV["ALGOLIA_SEARCH_ONLY_API_KEY"] })
  
    modules_index = algolia.init_index('modules')
  
    begin
      # Query Algolia for modules that match the search term.
      response = modules_index.search(term)
  
      # The search results are in the 'hits' key of the response.
      results = response.fetch('hits')
  
      # If a priority_module is provided, sort the results to put that module first.
      if priority_module
        results.sort_by! { |result| result.has_key?('objectID') && result.fetch('objectID') == priority_module ? 0 : 1 }
      end
  
    rescue => e
      puts "An error occurred: #{e.message}"
      results = []
    end
  
    return results
  end

  # def index_all_collections
  #   # Initialize Algolia
  #   algolia = Algolia::Client.new({ :application_id => ENV['ALGOLIA_APPLICATION_ID'], :api_key => ENV['ALGOLIA_ADMIN_API_KEY'] })

  #   # Replace 'modules' with the names of your collections
  #   collections = ['modules']

  #   collections.each do |collection|
  #     # Initialize the Algolia index for the collection
  #     index = algolia.init_index(collection)

  #     # Get the Firestore collection
  #     ref = $db.col(collection)

  #     # Fetch each document from the Firestore collection
  #     ref.get do |doc|
  #       data = doc.data.dup.tap { |h| h[:objectID] = doc.document_id }

  #       # Add the document data to Algolia
  #       index.save_object(data)
  #     end
  #   end
  # end
end
