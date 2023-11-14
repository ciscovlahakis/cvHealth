# frozen_string_literal: true

require "sinatra"
require "sinatra/reloader"
require_relative "config/initialize_firestore"
require_relative "models/meal_plan_generator"

helpers do
  def current_user
    return unless session.fetch("user_id", nil)

    user_id = session.fetch("user_id", nil)
    return unless user_id

    matching_users = User.where({ id: user_id })
    @current_user = matching_users.at(0)
  end
end

def get_data(ref)
  output = []
  ref.get do |x|
    data = x.data
    string_data = data.transform_keys(&:to_s) # Convert all keys to Strings
    output << string_data
  end
  return output
end

def navigate_to_page(ref, columns)
  @data = get_data(ref)
  @columns = columns
  erb :"shared/page"
end

get("/") do
  erb :home
end

get("/meal-plan") do
  @meal_plan = MealPlanGenerator.new(current_user).generate
  erb :meal_plan
end

get("/nutritional-components") do
  @title = "Nutritional Components"
  @description = "Calories, Protein, Sodium..."
  @create_button_title = "Create Nutritional Component"
  nutritional_components_ref = $firestore.col("nutritionalComponents")
  nutritional_components_columns = [
    { id: "name", name: "Name", type: String },
    { id: "eaten", name: "Eaten", type: Integer },
    { id: "min", name: "Min", type: Integer },
    { id: "max", name: "Max", type: Integer },
    { id: "target", name: "Target", type: Integer },
    { id: "progress", name: "Progress", type: Integer }
  ]
  navigate_to_page(nutritional_components_ref, nutritional_components_columns)
end

get("/foods") do
  erb :"shared/page"
end

get("/food-categories") do
  erb :"shared/page"
end

meal_events_ref = $firestore.col("meal_events")

get("/meal-events") do
  @title = "Meal Events"
  @description = "Manage your meal times, types, and constraints."
  @create_button_title = "Create Meal Event"
  meal_event_columns = [
    { id: "name", name: "Name", type: String },
    { id: "min_foods", name: "Min Foods", type: Integer },
    { id: "max_foods", name: "Max Foods", type: Integer },
    { id: "recurrence", name: "Recurrence", type: String },
  ]
  navigate_to_page(meal_events_ref, meal_event_columns)
end

post("/create-meal-event") do
  new_meal_event = {
    "name" => params.fetch("name"),
    "min_foods" => params.fetch("min-foods", "").to_i,
    "max_foods" => params.fetch("max-foods", "").to_i,
    "recurrence" => params.fetch("recurrence", "").to_i,
  }
  meal_events_ref.add(new_meal_event)
  redirect "/meal-events"
end

get("/recipes") do
  erb :"shared/page"
end

get("/statistics") do
  erb :"shared/page"
end
