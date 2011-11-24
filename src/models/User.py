"""
Document model for User.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from flaskext.mongokit import Document

class User(Document):
  __collection__ = 'users'
  structure = {
      'name':unicode,
      'email':unicode,
      'password':unicode
  }
  use_dot_notation = True
