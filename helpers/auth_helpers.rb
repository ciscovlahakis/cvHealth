# frozen_string_literal: true

helpers do
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
end
