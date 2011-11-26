"""
Document model for Circle.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from datetime import datetime
from flaskext.mongokit import Document
from pymongo.objectid import ObjectId

class Circle(Document):
  __collection__ = 'circles'
  structure = {
      'name':unicode,
      'owner':ObjectId,
      'date_created':datetime,
      'bookmarks':[ObjectId]
  }
  use_dot_notation = True
