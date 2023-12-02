# frozen_string_literal: true

get("/search") do
  term = params.fetch("term")
  current_route = request.path
  @results = search(term, current_route)

  @results = [] if @results.nil? || !@results.is_a?(Array)

  return @results.to_json
end

# get '/index_all' do
#   index_all_collections
#   "All collections have been indexed in Algolia."
# end
