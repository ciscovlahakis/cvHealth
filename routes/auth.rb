# frozen_string_literal: true
require 'bcrypt'

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
