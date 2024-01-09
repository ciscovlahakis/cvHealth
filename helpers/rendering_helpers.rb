# frozen_string_literal: true

require 'http'

def get_html(component_name)
  url = "https://storage.googleapis.com/cisco-vlahakis.appspot.com/#{component_name}.html"
  response = HTTP.get(url)

  if response.status.success?
    return response.to_s
  elsif response.status.code == 403
    logger.error "Access to #{component_name}'s HTML is forbidden. Check permissions."
  else
    logger.error "Failed to fetch #{component_name}'s HTML: #{response.status}"
  end

  halt(404, "HTML content not found for #{component_name}")
end
