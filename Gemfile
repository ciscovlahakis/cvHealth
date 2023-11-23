# frozen_string_literal: true

source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.2.1'


gem 'rubocop', require: false
gem 'sinatra'
gem 'sinatra-contrib'
gem 'google-cloud-firestore'
gem "google-cloud-storage", "~> 1.35"
gem 'bcrypt'
gem 'http'
gem 'dotenv'

# Use Puma as the app server
gem 'puma', '~> 5.0'

# use active record
gem 'sinatra-activerecord'

group :development do
  gem 'appdev_support'
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'table_print'
end

group :development, :test do
  gem 'grade_runner'
  gem 'pry'
  gem 'sqlite3', '~> 1.4'
end

group :test do
  gem 'capybara'
  gem 'draft_matchers'
  gem 'i18n'
  gem 'rspec'
  gem 'rspec-html-matchers'
  gem 'webdrivers'
  gem 'webmock'
end
