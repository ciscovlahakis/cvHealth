# frozen_string_literal: true

FIRESTORE_PATH_PREFIX = "projects/cisco-vlahakis/databases/(default)/documents/"

NUTRITIONAL_COMPONENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "eaten", :name => "Eaten", :type => Integer },
  { :id => "min", :name => "Min", :type => Integer },
  { :id => "max", :name => "Max", :type => Integer },
  { :id => "target", :name => "Target", :type => Integer },
  { :id => "progress", :name => "Progress", :type => Integer },
  { :id => "unit", :name => "Unit", :type => Integer },
]

FOOD_ATTRIBUTES = [
  { :id => "index", :name => "Index", :type => Integer },
  { :id => "name", :name => "Name", :type => String },
  { :id => "id", :name => "ID", :type => String },
]

MEAL_EVENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "min_foods", :name => "Min Foods", :type => Integer },
  { :id => "max_foods", :name => "Max Foods", :type => Integer },
  { :id => "recurrence", :name => "Recurrence", :type => String },
]

def get_attributes(payload)
  attributes = payload.each_with_object({}) do |(key, value_hash), hash|
    #next if key == 'id' || key == 'resource'
    # Assuming each field is an object with 'value' and 'type'
    hash[key] = value_hash['value'] if value_hash.is_a?(Hash) && value_hash.key?('value')
  end
  attributes
end

def validate_data(data)
  valid = true
  errors = []
  # if data['type'].nil?
  #   valid = false
  #   errors << "Type value is required."
  # end
  if data['name'].nil?
    valid = false
    errors << "Name value is required."
  end
  return valid, errors
end

def fetch_doc_data(coll_name, field_value = nil)
  if field_value
    return fetch_coll_data(coll_name, {
      :field => field_value[:field], 
      :operator => "=", 
      :value => field_value[:value]
    }).first
  end
  return fetch_coll_data(coll_name)
end

def fetch_coll_data(coll_name, query_params = nil)
  coll_ref = $db.col(coll_name)

  begin
    query = if query_params
      coll_ref.where(query_params[:field], query_params[:operator], query_params[:value])
    else
      coll_ref
    end

    docs = query.get

    docs.map do |doc|
      doc_data = doc.data.each_with_object({}) { |(k, v), new_hash| new_hash[k] = v }
      doc_data[:id] = doc.document_id
      doc_data[:path] = doc.path.split(FIRESTORE_PATH_PREFIX, 2).last  
      doc_data
    end
  rescue => e
    puts "Error fetching documents: #{e.message}"
    []
  end
end

def create_resource(coll_name, attributes)
  perform_resource_operation(coll_name) do
    coll_ref = $db.col(coll_name)
    doc_ref = coll_ref.add(attributes)
    new_doc_ref = coll_ref.doc(doc_ref.document_id)
    new_doc = new_doc_ref.get
    new_doc.data
  end
end

def update_resource(coll_name, attributes, id, full_update: false)
  perform_resource_operation(coll_name, id) do
    doc_ref = $db.col(coll_name).doc(id)
    if full_update
      doc_ref.set(attributes)
    else
      doc_ref.set(attributes, merge: true)
    end
    updated_doc = doc_ref.get
    updated_doc.data
  end
end

def delete_resource(coll_name, id)
  perform_resource_operation(coll_name, id) do
    ref = $db.col(coll_name).doc(id)
    ref.delete
    { message: "Resource deleted successfully" }
  end
end

def sort_and_assign_positions(data, resource)
  # Start from position 1
  position = 1
  # Sort the data by the existing 'position' attribute
  sorted_data = data.sort_by { |d| d.fetch("position", 0) }
  # Assign new positions to all items
  sorted_data.each do |d|
    # Update the position in the data
    d["position"] = position
    # Update the position in the database
    ref = $db.col(resource).doc(d["id"])
    # Start a transaction
    $db.transaction do |tx|
      # Add this operation to the transaction
      tx.set(ref, { :position => position }, merge: true)
    end
    # Increment the position for the next item
    position += 1
  end
  # Return the sorted data
  return sorted_data
end

def move(coll_src, coll_dest)
  docs = fetch_coll_data(coll_src)
  docs.each do |doc|
    unfrozen_doc = doc.each_with_object({}) { |(k, v), new_hash| new_hash[k] = v }
    new_doc_ref = $db.col(coll_dest).doc(unfrozen_doc[:id])
    new_doc_ref.set(unfrozen_doc)

    # Construct the path for deletion using coll name and doc ID
    path_to_delete = "#{coll_src}/#{unfrozen_doc[:id]}"
    $db.doc(path_to_delete).delete
  end
end

def perform_resource_operation(coll_name, id = nil)
  raise ArgumentError, "Coll name is required" if coll_name.nil? || coll_name.to_s.strip.empty?
  raise ArgumentError, "Document ID is required" if !id.nil? && id.to_s.strip.empty?
  begin
    # Yield to the specific operation block (update, delete, etc.)
    result = yield if block_given?
    # Return a success response with the result
    success_response(result)
  rescue ArgumentError => e
    puts "Argument Error: #{e.message}"
    error_response(400, e.message)
  rescue => e
    puts "Error during operation: #{e.message}"
    error_response(500, "Internal Server Error: #{e.message}")
  end
end

def success_response(data)
  status 200
  content_type :json
  data.to_json
end

def error_response(status_code, message)
  status status_code
  content_type :json
  { error: message }.to_json
end
