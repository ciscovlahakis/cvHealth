# frozen_string_literal: true

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

def get_attributes(resource)
  case resource
  when "nutritional-components"
    NUTRITIONAL_COMPONENT_ATTRIBUTES
  when "foods"
    FOOD_ATTRIBUTES
  when "meal-events"
    MEAL_EVENT_ATTRIBUTES
  else
    []
  end
end

def resource_and_attributes
  @resource = params.fetch("resource")
  attributes = get_attributes(@resource)
  return @resource, attributes
end

def fetch_collection_data(collection_name, query_params = nil)
  collection_ref = $db.col(collection_name)

  if query_params
    documents = collection_ref.where(query_params[:field], query_params[:operator], query_params[:value]).get
  else
    documents = collection_ref.get
  end

  documents.map(&:data)
end

def fetch_document_data(collection_name, field_value = nil)
  if field_value
    fetch_collection_data(collection_name, {
      :field => field_value[:field], 
      :operator => "=", 
      :value => field_value[:value]
    }).first
  else
    fetch_collection_data(collection_name)
  end
end

def create_item(collection_name, attributes)
  new_item = attributes.each_with_object({}) do |(key, value_hash), hash|
    value = value_hash.fetch("value")
    type = value_hash.fetch("type")
    
    case type
    when "integer"
      hash.store(key, value.to_i)
    else
      hash.store(key, value)
    end
  end

  collection_ref = $db.col(collection_name)
  doc_ref = collection_ref.add(new_item)

  status 200
  content_type :json
  return { :id => doc_ref.document_id }.to_json
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
