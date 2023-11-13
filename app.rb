require "sinatra"
require "sinatra/reloader"
require_relative 'config/initialize_firestore'
require_relative 'models/meal_plan_generator'

helpers do
  def current_user
    if session.fetch("user_id", nil)
      user_id = session.fetch("user_id", nil)
      if user_id
        matching_users = User.where({ :id => user_id })
        @current_user = matching_users.at(0)
      end
    end
  end
end

get("/") do
  erb(:home)
end

get("/meal-plan") do
  @meal_plan = MealPlanGenerator.new(current_user).generate
  erb(:meal_plan)
end

get("/nutritional-components") do
  erb(:nutritional_components)
end

get("/foods") do
  erb(:foods)
end

get("/food-categories") do
  erb(:food_categories)
end

get('/meal-events') do
  meal_events_ref = $firestore.col('meal_events')
  @meal_events = meal_events_ref.get do |meal_event|
    meal_event.data
  end

  erb(:meal_events)
end

get("/recipes") do
  erb(:recipes)
end

get("/statistics") do
  erb(:statistics)
end


# class UsersController < ApplicationController
#   def index
#     firestore = initialize_firestore
#     users_ref = firestore.col 'users'
#     users = users_ref.get
#     render({ :template => "users/index", :locals => { :users => users } })
#   end
# end
