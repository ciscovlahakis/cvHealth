require "sinatra"
require "sinatra/reloader"
require_relative 'config/initialize_firestore'

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

get("/meal-structures") do
  erb(:meal_structures)
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
