"""
Document model for Bookmark Suggestions 
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from flaskext.mongokit import Document

# Couldn't figure out if MongoDB
# allows scalable sorting by dictionary keys
# so I'm doing in this way in case it doesn't 

class Suggestion(Document):
  __collection__ = 'suggestions'
  structure = {
      'url':unicode,
      'suggestion':unicode, # url 
      'score': float,
  }
  use_dot_notation = True
