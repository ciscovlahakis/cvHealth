# frozen_string_literal: true

require "sinatra"
require "sinatra/reloader"
require_relative "config/initialize_firestore"
require_relative "models/meal_plan_generator"

SIDEBAR_LINKS = {
  "meal-plan" => { :title => "Meal Plan", :icon => "fas fa-calendar", :create_title => false },
  "nutritional-components" => { :title => "Nutritional Components", :icon => "fas fa-cubes", :description => "Calories, Protein, Sodium...", :create_title => true, :enable_move => true },
  "foods" => { :title => "Foods", :icon => "fas fa-apple-alt", :create_title => true },
  "food-categories" => { :title => "Food Categories", :icon => "fas fa-list-ul", :create_title => true },
  "meal-events" => { :title => "Meal Events", :icon => "fas fa-clock", :description => "Manage your meal times, types, and constraints.", :create_title => true, :enable_move => true },
  "recipes" => { :title => "Recipes", :icon => "fas fa-clipboard-list", :create_title => true },
  "statistics" => { :title => "Statistics", :icon => "fas fa-chart-pie", :create_title => false },
}

NUTRITIONAL_COMPONENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "eaten", :name => "Eaten", :type => Integer },
  { :id => "min", :name => "Min", :type => Integer },
  { :id => "max", :name => "Max", :type => Integer },
  { :id => "target", :name => "Target", :type => Integer },
  { :id => "progress", :name => "Progress", :type => Integer },
  { :id => "unit", :name => "Unit", :type => Integer }
]

FOOD_ATTRIBUTES = [
  { :id => "index", :name => "Index", :type => Integer },
  { :id => "name", :name => "Name", :type => String },
  { :id => "id", :name => "ID", :type => String },
  # Add more attributes here if needed
]

MEAL_EVENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "min_foods", :name => "Min Foods", :type => Integer },
  { :id => "max_foods", :name => "Max Foods", :type => Integer },
  { :id => "recurrence", :name => "Recurrence", :type => String },
]

helpers do
  def get_attributes(resource)
    case resource
    when "nutritional-components"
      NUTRITIONAL_COMPONENT_ATTRIBUTES
    when "foods"
      FOOD_ATTRIBUTES
    when "meal-events"
      MEAL_EVENT_ATTRIBUTES
    # Add more cases here for other resources
    end
  end

  def resource_and_attributes
    @resource = params.fetch("resource")
    attributes = get_attributes(@resource)
    return @resource, attributes
  end

  def render_page(path, columns)
    sidebar_link_hash = SIDEBAR_LINKS.fetch(path)
    @title = sidebar_link_hash.fetch(:title, "")
    @icon = sidebar_link_hash.fetch(:icon, "")
    @description = sidebar_link_hash.fetch(:description, "")
    @enable_move = sidebar_link_hash.fetch(:enable_move, false)
    if sidebar_link_hash.fetch(:create_title, false)
      @create_title = "Create #{@title.chop}"
    end

    ref = $firestore.col(path)
    @data = get_data(ref, path)
    @columns = columns
    erb :"shared/page"
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
    collection_ref = $firestore.col(collection_name)
    collection_ref.add(new_item)
    redirect "/#{collection_name}"
  end

  def sort_and_assign_positions(data, resource)
    # Start from position 1
    position = 1
  
    # Sort the data by the existing 'position' attribute
    sorted_data = data.sort_by { |d| d.fetch('position', 0) }
  
    # Assign new positions to all items
    sorted_data.each do |d|
      # Update the position in the data
      d['position'] = position
  
      # Update the position in the database
      ref = $firestore.col(resource).doc(d['id'])
  
      # Start a transaction
      $firestore.transaction do |tx|
        # Add this operation to the transaction
        tx.set(ref, { :position => position }, merge: true)
      end

      # Increment the position for the next item
      position += 1
    end

    # Return the sorted data
    return sorted_data
  end

  def get_data(ref, resource)
    output = []
    ref.get do |doc|
      data = doc.data
      data_with_id = data.merge({ 'id' => doc.document_id })
      string_data = data_with_id.transform_keys(&:to_s) # Convert all keys to Strings
      output << string_data
    end
    
    # Sort the output array based on the 'position' field
    output = output.sort_by { |item| item.fetch('position') }
    return output
  end

  def current_user
    return unless session.fetch("user_id", nil)
    user_id = session.fetch("user_id", nil)
    return unless user_id
    matching_users = User.where({ id: user_id })
    @current_user = matching_users.at(0)
  end
end

post("/update_position") do
  id = params.fetch("id")
  new_position = params.fetch("position").to_i
  resource = params.fetch("resource")
  ref = $firestore.col(resource).doc(id)
  ref.set({ :position => new_position }, merge: true)
  return { :status => "success" }.to_json
end

get("/") do
  erb :home
end

get("/meal-plan") do
  @meal_plan = MealPlanGenerator.new(current_user).generate
  erb :meal_plan
end

get("/statistics") do
  erb :home
end

get("/:resource") do
  resource, attributes = resource_and_attributes()
  render_page(resource, attributes)
end

post("/create/:resource") do
  resource, attributes = resource_and_attributes()
  create_item(resource, attributes)
end

post("/update/:resource") do
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
  collection_ref = $firestore.col(resource).doc(id)  # Pass the existing document's id to doc(id)
  collection_ref.set(updated_item)
  redirect "/#{resource}"
end

post("/delete/:resource") do
  resource = params.fetch("resource")
  id = params.fetch("id")
  ref = $firestore.col(resource).doc(id)
  ref.delete
  redirect "/#{resource}"
end
