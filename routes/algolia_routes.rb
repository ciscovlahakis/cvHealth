# frozen_string_literal: true

get "/search/:index_name" do
  index_name = params.fetch("index_name")
  term = params.fetch("term", '')
  priority_module = params.fetch("priority_module", nil)

  # Check if the search term is empty before performing the search
  if term.empty?
    # Indicate that the client should listen to Firestore
    content_type :json
    return { :use_firestore => true }.to_json
  else
    results = search(index_name, term, priority_module)
    content_type :json
    return results.to_json
  end
end

# get "/index_all" do
#   index_all_collections
#   "All collections have been indexed in Algolia."
# end
