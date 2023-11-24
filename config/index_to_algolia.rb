require "algolia"
require "google/cloud/firestore"

modules_index = AlgoliaClient.init_index('modules')

modules_ref = firestore.col("modules")
modules_ref.get.each do |module_doc|
  module_data = module_doc.data
  module_data[:objectID] = module_doc.document_id
  modules_index.save_object(module_data)
end
