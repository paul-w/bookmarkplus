"""
Document model for Bookmark.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from datetime import datetime
from flaskext.mongokit import Document
from pymongo.objectid import ObjectId

class Bookmark(Document):
  __collection__ = 'bookmarks'
  structure = {
      'url':unicode,
      'circles':[ObjectId],
      'owner':ObjectId,
      'date_created':datetime,
      'date_last_clicked':datetime,
      'clicks':int
  }
  use_dot_notation = True
  default_values = {'date_created':datetime.utcnow}
