# frozen_string_literal: true

require "sinatra"
require "sinatra/reloader"
require_relative "config/initialize_firestore"
require_relative "models/meal_plan_generator"

SIDEBAR_LINKS = {
  "meal-plan" => { :title => "Meal Plan", :icon => "fas fa-calendar", :create_button => false },
  "nutritional-components" => { :title => "Nutritional Components", :icon => "fas fa-cubes", :description => "Calories, Protein, Sodium...", :create_button => true },
  "foods" => { :title => "Foods", :icon => "fas fa-apple-alt", :create_button => true },
  "food-categories" => { :title => "Food Categories", :icon => "fas fa-list-ul", :create_button => false },
  "meal-events" => { :title => "Meal Events", :icon => "fas fa-clock", :description => "Manage your meal times, types, and constraints.", :create_button => true },
  "recipes" => { :title => "Recipes", :icon => "fas fa-clipboard-list", :create_button => false },
  "statistics" => { :title => "Statistics", :icon => "fas fa-chart-pie", :create_button => false },
}

NUTRITIONAL_COMPONENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "eaten", :name => "Eaten", :type => Integer },
  { :id => "min", :name => "Min", :type => Integer },
  { :id => "max", :name => "Max", :type => Integer },
  { :id => "target", :name => "Target", :type => Integer },
  { :id => "progress", :name => "Progress", :type => Integer },
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
    when "meal-events"
      MEAL_EVENT_ATTRIBUTES
      # add more cases here for other resources
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
    if sidebar_link_hash.fetch(:create_button, false)
      @create_button_title = "Create #{@title}".chop
    end

    ref = $firestore.col(path)
    @data = get_data(ref)
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

  def get_data(ref)
    output = []
    ref.get do |doc|
      data = doc.data
      data_with_id = data.merge({ 'id' => doc.document_id })
      string_data = data_with_id.transform_keys(&:to_s) # Convert all keys to Strings
      output << string_data
    end
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
