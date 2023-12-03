# frozen_string_literal: true

require 'dotenv'
Dotenv.load

require "sinatra"
require "sinatra/reloader" if development?

set :session_secret, '902aaebd6da3f5260862b475ab940d300e586076d18cb21d7e7dcbbec2feadad'
set :sessions, key: 'my_app_key', expire_after: 1440, secret: '902aaebd6da3f5260862b475ab940d300e586076d18cb21d7e7dcbbec2feadad'

def load_files(directory, &block)
  Dir[File.join(File.dirname(__FILE__), directory, '*.rb')].each do |file|
    also_reload file # DEVELOPMENT ONLY
    require file
  end
end

directories = %w[config routes]
directories.each { |directory| load_files(directory) }

helpers { load_files('helpers') }

before do
  current_user()
  if session.fetch("error", nil)
    @error = session.fetch("error")
    session.store("error", nil)
  end
end
