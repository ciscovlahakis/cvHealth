# frozen_string_literal: true

require 'dotenv'
Dotenv.load

require "sinatra"
require "sinatra/reloader"
require_relative 'config/google_cloud_storage'
require_relative "config/firestore_server"
require_relative "models/meal_plan_generator"
require 'bcrypt'
require 'http'
require 'json'
require 'erb'
require 'ostruct'

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
# Add more attributes here if needed
]

MEAL_EVENT_ATTRIBUTES = [
  { :id => "name", :name => "Name", :type => String },
  { :id => "min_foods", :name => "Min Foods", :type => Integer },
  { :id => "max_foods", :name => "Max Foods", :type => Integer },
  { :id => "recurrence", :name => "Recurrence", :type => String },
]

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
    else
      []
    end
  end

  def resource_and_attributes
    @resource = params.fetch("resource")
    attributes = get_attributes(@resource)
    return @resource, attributes
  end

  def render_page(path, columns)
    
    ref = $db.col(path)
    @data = get_data(ref, path)
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

  def get_data(ref, resource)
    output = []
    ref.get do |doc|
      data = doc.data
      data_with_id = data.merge({ "id" => doc.document_id })
      string_data = data_with_id.transform_keys(&:to_s) # Convert all keys to Strings
      output << string_data
    end

    # Sort the output array based on the 'position' field
    output = output.sort_by { |item| item.fetch("position", 0) }
    return output
  end

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
      puts "Profile Picture Path: #{@current_user[:profile_picture]}" # Add this line
    end
    return @current_user
  end

  def ensure_admin!
    user = current_user()
    redirect to("/") unless user && user[:admin]
  end

end

post "/update_position" do
  id = params.fetch("id")
  new_position = params.fetch("position").to_i
  resource = params.fetch("resource")
  ref = $db.col(resource).doc(id)
  ref.set({ :position => new_position }, merge: true)
  return { :status => "success" }.to_json
end

before do
  current_user()
  if session.fetch("error", nil)
    @error = session.fetch("error")
    session.store("error", nil) # Clear the error message from the session
  end
end

get "/meal-plan" do
  @meal_plan = MealPlanGenerator.new(@current_user).generate
  erb :meal_plan
end

# get "/statistics" do
#   erb :home
# end

get "/:resource" do
  resource, attributes = resource_and_attributes()
  render_page(resource, attributes)
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

get "/admin/pages" do
  @current_user = current_user
  ensure_admin!
  @admin_links = ADMIN_LINKS
  erb :"admin/pages"
end

get "/admin/collections" do
  ensure_admin!
  @admin_links = ADMIN_LINKS
  erb :"admin/collections"
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
  puts "Stored user_id in session: #{session.fetch("user_id")}"

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

# Log out action
post "/logout" do
  session.clear
  redirect to(request.referer || "/")
end

get "/components" do
  ensure_admin!
  @admin_links = ADMIN_LINKS
  erb :"admin/collections"
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
  redirect "/"
end

helpers do

  def ensure_properties(hash)
    hash.default_proc = proc { |h, k| h[k] = {} }
    hash.each do |key, value|
      if value.is_a?(Hash)
        ensure_properties(value)
      end
    end
  end


  # Fetches the HTML template and properties for a given component
  def fetch_data(component)
    return { :template => '', :properties => {} } if component.nil?
  
    url = component.fetch(:url, '').strip
    properties = component.fetch(:properties, {})
    ensure_properties(properties)
  
    # Return early if the URL is blank
    return { :template => '', :properties => {} } if url.empty?
  
    # Fetch the HTML template from GCS
    response = HTTP.get(url)
  
    return { 
      :template => response.to_s, 
      :properties => properties 
    }
  end
  
  # Renders the HTML template with the provided properties
  def render_component(data)
    properties = data.fetch(:properties).transform_values do |value|
      case value
      when Hash
        if value.key?(:url)
          render_component(fetch_data(value)) 
        else
          value
        end
      else
        value
      end
    end
  
    # Add session data and current user to the properties
    properties["session"] = session
    properties["current_user"] = current_user()
    
    # Render the HTML template with the properties
    erb_template = ERB.new(data[:template])
    
    # Create a new OpenStruct from properties and get its binding
    context = OpenStruct.new(properties).instance_eval { binding }

    return erb_template.result(context)
  end
end


get "/*" do
  # Get the route from the URL
  route = request.path_info[1..] # Remove the leading slash

  # Fetch the corresponding Page record from Firestore
  pages_col = $db.col("pages")
  matching_pages = pages_col.where("route", "=", route).get
  the_page = matching_pages.first

  # If the page is not found, redirect to a 404 page
  if the_page.nil?
    redirect "/404"
  else
    # Get the component object from the Page document
    component = the_page.data.fetch(:component, {})

    # Fetch the data from GCS and render the component
    data = fetch_data(component)
    html_content = render_component(data)

    # Render the HTML content
    erb :page, :locals => { :html_content => html_content }
  end
end
