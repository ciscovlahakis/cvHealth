# frozen_string_literal: true

helpers do
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

  def create_item(collection_name, attributes)
    new_item = attributes.each_with_object({}) do |attribute, hash|
      id = attribute.fetch(:id)
      if attribute.fetch(:type) == Integer
        hash[id] = params.fetch(id, "").to_i
      else
        hash[id] = params.fetch(id, "")
      end
    end
    collection_ref = $db.col(collection_name)
    collection_ref.add(new_item)
    redirect "/#{collection_name}"
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
end
