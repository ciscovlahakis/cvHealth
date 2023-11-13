# frozen_string_literal: true

require 'sinatra'
require 'sinatra/reloader'
require_relative 'config/initialize_firestore'
require_relative 'models/meal_plan_generator'

helpers do
  def current_user
    return unless session.fetch('user_id', nil)

    user_id = session.fetch('user_id', nil)
    return unless user_id

    matching_users = User.where({ id: user_id })
    @current_user = matching_users.at(0)
  end
end

get('/') do
  erb(:home)
end

get('/meal-plan') do
  @meal_plan = MealPlanGenerator.new(current_user).generate
  erb(:meal_plan)
end

get('/nutritional-components') do
  erb(:nutritional_components)
end

get('/foods') do
  erb(:foods)
end

get('/food-categories') do
  erb(:food_categories)
end

@meal_events = []

get('/meal-events') do
  meal_events_ref = $firestore.col('meal_events')
  @meal_events = []

  meal_events_ref.get do |meal_event|
    data = meal_event.data
    string_data = data.transform_keys(&:to_s) # Convert all keys to Strings
    @meal_events << string_data
  end

  erb(:meal_events)
end

# The new post route
# post('/create-meal-event') do
#   meal_events_ref = $firestore.col('meal_events')

#   # Here we're creating a new hash with the data from the form
#   new_meal_event = {
#     'name' => params.fetch('name'),
#     # 'parent_meal_event' => params.fetch('parent-meal-event', ''),
#     # 'min_foods' => params.fetch('min-foods').to_i,
#     # 'max_foods' => params.fetch('max-foods').to_i,
#     # 'recurrence' => params.fetch('recurrence').to_i,
#     # 'recurrence-weekly' => params.fetch('recurrence-weekly').to_i,
#     # 'days' => params.fetch('days', []),
#     # 'cuisine' => params.fetch('cuisine')
#   }

#   # Then we're adding it to Firestore
#   meal_events_ref.add(new_meal_event)

#   # After the new meal event is created, you might want to redirect back to your main page
#   redirect '/meal-events'
# end

get('/recipes') do
  erb(:recipes)
end

get('/statistics') do
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
