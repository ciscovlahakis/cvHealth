# frozen_string_literal: true

require 'dotenv'
Dotenv.load

require "sinatra"
require "sinatra/reloader"
require_relative 'config/google_cloud_storage'
require_relative "config/firestore_server"
require_relative "models/meal_plan_generator"
require 'yaml'
require 'bcrypt'
require 'http'
require 'json'
require 'erb'
require 'ostruct'
require 'algoliasearch'

# Add these lines to your existing code
set :session_secret, '902aaebd6da3f5260862b475ab940d300e586076d18cb21d7e7dcbbec2feadad' # replace with your actual secret string
set :sessions, key: 'my_app_key', expire_after: 1440, secret: '902aaebd6da3f5260862b475ab940d300e586076d18cb21d7e7dcbbec2feadad'

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

helpers do

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

  # def render_page(path, columns)
  #   ref = $db.col(path)
  #   @data = get_data(ref, path)
  #   erb :"shared/page"
  # end

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

  # def get_data(ref, resource)
  #   output = []
  #   ref.get do |doc|
  #     data = doc.data
  #     data_with_id = data.merge({ "id" => doc.document_id })
  #     string_data = data_with_id.transform_keys(&:to_s) # Convert all keys to Strings
  #     output << string_data
  #   end

  #   # Sort the output array based on the 'position' field
  #   output = output.sort_by { |item| item.fetch("position", 0) }
  #   return output
  # end

  def current_user
    return unless session.fetch("user_id", nil)
    user_id = session.fetch("user_id", nil)
    return unless user_id
    users_ref = $db.col("users")
    user = users_ref.doc(user_id).get
    if user.exists?
      @current_user = user.data.dup # Create a duplicate of user.data that is not frozen
      @current_user[:id] = user.document_id
      @current_user[:profile_picture] = user.data[:profile_picture]
    end
    return @current_user
  end

  def ensure_admin!
    user = current_user()
    redirect to("/") unless user && user[:admin]
  end

  def search(term, priority_module = nil)
    term = params.fetch("term")
    priority_module = request.path
  
    algolia = Algolia::Client.new({ :application_id => ENV["ALGOLIA_APPLICATION_ID"], :api_key => ENV["ALGOLIA_SEARCH_ONLY_API_KEY"] })
  
    modules_index = algolia.init_index('modules')
  
    begin
      # Query Algolia for modules that match the search term.
      response = modules_index.search(term)
  
      # The search results are in the 'hits' key of the response.
      results = response.fetch('hits')
  
      # If a priority_module is provided, sort the results to put that module first.
      if priority_module
        results.sort_by! { |result| result.has_key?('objectID') && result.fetch('objectID') == priority_module ? 0 : 1 }
      end
  
    rescue => e
      puts "An error occurred: #{e.message}"
      results = []
    end
  
    return results
  end

  # def index_all_collections
  #   # Initialize Algolia
  #   algolia = Algolia::Client.new({ :application_id => ENV['ALGOLIA_APPLICATION_ID'], :api_key => ENV['ALGOLIA_ADMIN_API_KEY'] })

  #   # Replace 'modules' with the names of your collections
  #   collections = ['modules']

  #   collections.each do |collection|
  #     # Initialize the Algolia index for the collection
  #     index = algolia.init_index(collection)

  #     # Get the Firestore collection
  #     ref = $db.col(collection)

  #     # Fetch each document from the Firestore collection
  #     ref.get do |doc|
  #       data = doc.data.dup.tap { |h| h[:objectID] = doc.document_id }

  #       # Add the document data to Algolia
  #       index.save_object(data)
  #     end
  #   end
  # end
end

get '/firestore_config' do
  begin
    firestore_config = {
      :apiKey => ENV["FIREBASE_API_KEY"],
      :authDomain => ENV["FIREBASE_AUTH_DOMAIN"],
      :databaseURL => ENV["FIREBASE_DATABASE_URL"],
      :projectId => ENV["FIREBASE_PROJECT_ID"],
      :storageBucket => ENV["FIREBASE_STORAGE_BUCKET"],
      :messagingSenderId => ENV["FIREBASE_MESSAGING_SENDER_ID"],
      :appId => ENV["FIREBASE_APP_ID"]
    }
    content_type :json
    return firestore_config.to_json
  rescue => e
    content_type :json
    status 500
    return { :error => e.message }.to_json
  end
end

# get '/index_all' do
#   index_all_collections
#   "All collections have been indexed in Algolia."
# end

get("/search") do
  term = params.fetch("term")
  current_route = request.path
  @results = search(term, current_route)

  @results = [] if @results.nil? || !@results.is_a?(Array)

  return @results.to_json
end

get "/meal-plan" do
  @meal_plan = MealPlanGenerator.new(@current_user).generate
  erb :meal_plan
end

# get "/:resource" do
#   resource, attributes = resource_and_attributes()
#   render_page(resource, attributes)
# end

get "/favicon.ico" do
  # Handle favicon.ico requests separately
end

def fetch_page_data(route)
  matching_pages = $db.col("pages").where("route", "=", route).get
  first_page = matching_pages.first
  if first_page.nil?
    puts "No pages found for route #{route}"
    return nil
  else
    return first_page.data
  end
end

def replace_inherit_values(props_data, page_data)
  return nil if props_data.nil?
  props_data.each do |key, value|
    if value.is_a?(Hash)
      replace_inherit_values(value, page_data)
    elsif value == "__inherit__" && page_data.key?(key)
      props_data.store(key, page_data.fetch(key))
    end
  end
  return props_data
end

def get_props_data(id, defaults)
  return nil if id.nil? || id.empty?
  props_col = $db.col("props")
  props_doc = props_col.doc(id).get
  props_data = props_doc.data if props_doc.exists?
  return replace_inherit_values(props_data, defaults)
end

def render_component(component_name, parent_component_props, inherited_props_data = {})
  locals = {}

  component_props = parent_component_props.fetch(component_name.to_sym, {})
  inherited_component_props = inherited_props_data.fetch(component_name.to_sym, {})

  component_props = replace_inherit_values(component_props, @page_data)
  inherited_component_props = replace_inherit_values(inherited_component_props, @inherited_page_data)

  component_template = HTTP.get("https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component_name}.erb").to_s
  metadata_string = component_template[/---(.*?)---/m, 1]

  if metadata_string
    begin
      component_metadata = YAML.load(metadata_string)
      # remove the metadata string from the component template
      component_template.gsub!(/---(.*?)---/m, '')
    rescue
      return "Error parsing metadata for #{component_name}"
    end

    # Iterate through the component metadata
    component_metadata.each do |nested_component|
      component_key = nested_component

      # If the nested component is a Hash, check for the render_if_exists and yield keys
      if nested_component.is_a?(Hash)
        component_key = nested_component.keys.at(0)

        render_if_exists = nested_component.fetch(component_key, {}).fetch("render_if_exists", nil)

        # If render_if_exists is specified, fetch the specified key from the component props
        # If the value is nil or "__inherit__", do not render the component
        if render_if_exists
          render_if_exists = [render_if_exists] unless render_if_exists.is_a?(Array)
          should_render = render_if_exists.all? do |render_if_exists_key|
            component_value = component_props.fetch(component_key.to_sym, {}).fetch(render_if_exists_key.to_sym, nil)
            inherited_component_value = inherited_component_props.fetch(component_key.to_sym, {}).fetch(render_if_exists_key.to_sym, nil)
            render_if_exists_value = component_value || inherited_component_value
            !(render_if_exists_value == "__inherit__" || !render_if_exists_value || (render_if_exists_value.respond_to?(:empty?) && render_if_exists_value.empty?))
          end
          if !should_render
            locals[component_key] = nil
            next
          end
        end

        _yield = nested_component.fetch(component_key, {}).fetch("yield", false)
        if _yield
          locals[component_key] = component_props.fetch(component_key.to_sym, {}).keys.map do |yielded_component_name|
            # Ignore inherited props if yield is true
            render_component(yielded_component_name, component_props.fetch(yielded_component_name, {}), {}).to_s
          end.join
        end
      end

      if !locals[component_key]
        # Shallow merge props
        merged_component_props = inherited_component_props.merge(component_props)
        locals[component_key] = render_component(component_key, merged_component_props, inherited_props_data.fetch(component_key, {})).to_s
      end
    end
  end

  component_props.merge!(:current_user => @current_user, :session => @session, :breadcrumbs => @breadcrumbs)

  ERB.new(component_template).result_with_hash(component_props.merge(locals))
end

get "/*" do
  route = request.path_info
  route_components = route == "/" ? [""] : ["/"] + route.split("/")[1..]

  @breadcrumbs = []
  html_content = ""

  route_components.each_with_index do |component, index|
    breadcrumb_route = route_components[0..index].join("")
    breadcrumb_route = "/" if breadcrumb_route == ""

    @page_data = fetch_page_data(breadcrumb_route)
    next if breadcrumb_route.nil? || @page_data.nil?

    @breadcrumbs.push(@page_data)
    
    if breadcrumb_route == route
      current_props_data = get_props_data(@page_data.fetch(:props, ''), @page_data)

      inherits_from = @page_data.fetch(:inherits_from, nil)
      @inherited_page_data = {}
      inherited_props_data = {}

      if inherits_from
        @inherited_page_data = fetch_page_data(inherits_from)
        break if !@inherited_page_data
        inherited_props_data = get_props_data(@inherited_page_data.fetch(:props, ''), @inherited_page_data)
      end

      if @page_data && current_props_data
        html_content = render_component(current_props_data.keys.at(0), current_props_data, inherited_props_data)
      end
    end
  end

  erb :page, :locals => { :html_content => html_content }
end

post "/update_position" do
  id = params.fetch("id")
  new_position = params.fetch("position").to_i
  resource = params.fetch("resource")
  ref = $db.col(resource).doc(id)
  ref.set({ :position => new_position }, merge: true)
  return { :status => "success" }.to_json
end

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

post "/sign_up" do
  username = params.fetch("username")
  password = params.fetch("password")
  profile_picture = params.fetch("profile_picture", nil)

  hashed_password = BCrypt::Password.create(password)

  # Create a new user with the submitted username and hashed password
  new_user = { :username => username, :password => hashed_password }

  # Save the new user to the Firestore database
  users_ref = $db.col("users")
  added_user_ref = users_ref.add(new_user)

  # Log the user in by setting the session user_id
  session.store("user_id", added_user_ref.document_id)

  # Create a Google Cloud Storage client
  storage = Google::Cloud::Storage.new

  # Get the Google Cloud Storage bucket
  bucket = storage.bucket "cisco-vlahakis.appspot.com"

  # Only upload the profile picture if one was provided
  if profile_picture
    # Create a unique filename for the profile picture
    profile_picture_filename = "uploads/#{added_user_ref.document_id}/#{profile_picture[:filename]}"

    # Upload the profile picture to the bucket
    bucket.create_file profile_picture[:tempfile], profile_picture_filename, acl: "publicRead"

    # Update the user with the profile picture filename
    added_user_ref.update({ :profile_picture => profile_picture[:filename] }) # Only store the filename
  end

  redirect to(request.referer || "/")
end

post "/login" do
  username = params.fetch("username")
  password = params.fetch("password")

  users_ref = $db.col("users")
  users_ref.get do |user|
    if user.data[:username] == username && BCrypt::Password.new(user.data[:password]) == password
      session.store("user_id", user.document_id)
      @current_user = {
        :username => username,
        :profile_picture => user.data[:profile_picture],
        :admin => user.data[:admin],
        :super_admin => user.data[:super_admin]
      }
      redirect to(request.referer || "/")
    else
      # Store the error message in the session
      session.store("error", "Invalid username or password.")
      redirect to(request.referer || "/")
    end
  end
end

post "/logout" do
  session.clear
  redirect to(request.referer || "/")
end

post "/upload" do
  # Get the file from the request
  file = params.fetch("file")

  # Create a unique filename
  filename = file[:filename]

  storage = Google::Cloud::Storage.new
  bucket = storage.bucket "cisco-vlahakis.appspot.com"

  # Specify the Cache-Control metadata
  cache_control = "no-cache, no-store, must-revalidate"

  # Upload the file to GCS
  gcs_file = bucket.create_file(file[:tempfile], filename, cache_control: cache_control, acl: "publicRead")

  # Get the public URL of the file
  url = gcs_file.public_url

  # Add a new document to Firestore with the URL
  x = "components"
  doc_ref = $db.doc("#{x}/#{filename}")
  doc_ref.set({ url: url })

  # Redirect to the home page
  redirect back
end

# Define all your before filters
before do
  current_user()
  if session.fetch("error", nil)
    @error = session.fetch("error")
    session.store("error", nil) # Clear the error message from the session
  end
end
