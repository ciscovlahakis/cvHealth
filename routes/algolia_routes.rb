# frozen_string_literal: true

get "/search/:index_name" do
  index_name = params.fetch("index_name")
  term = params.fetch("term", '')
  priority_module = params.fetch("priority_module", nil)

  results = search(index_name, term, priority_module)

  content_type :json
  return results.to_json
end

# get "/index_all" do
#   index_all_collections
#   "All collections have been indexed in Algolia."
# end
