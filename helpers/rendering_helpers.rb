# frozen_string_literal: true

require 'http'
require 'json'
require 'yaml'
 


def get_data(id, col)
  return nil if id.nil? || id.empty?
  _col = $db.col(col)
  _doc = _col.doc(id).get
  _data = _doc.data if _doc.exists?
  return _data
end
