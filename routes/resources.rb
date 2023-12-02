# frozen_string_literal: true

post "/create/:resource" do
  resource, attributes = resource_and_attributes()
  create_item(resource, attributes)
end

post "/update/:resource" do
  resource, attributes = resource_and_attributes()
  id = params.fetch("id")  # Fetch the existing document's id from params
  updated_item = attributes.each_with_object({}) do |attribute, hash|
    attribute_id = attribute.fetch(:id)
    if attribute.fetch(:type) == Integer
      hash[attribute_id] = params.fetch(attribute_id, "").to_i
    else
      hash[attribute_id] = params.fetch(attribute_id, "")
    end
  end
  collection_ref = $db.col(resource).doc(id)  # Pass the existing document's id to doc(id)
  collection_ref.set(updated_item)
  redirect "/#{resource}"
end

post "/delete/:resource" do
  resource = params.fetch("resource")
  id = params.fetch("id")
  ref = $db.col(resource).doc(id)
  ref.delete
  redirect "/#{resource}"
end

post "/update_position" do
  id = params.fetch("id")
  new_position = params.fetch("position").to_i
  resource = params.fetch("resource")
  ref = $db.col(resource).doc(id)
  ref.set({ :position => new_position }, merge: true)
  return { :status => "success" }.to_json
end
