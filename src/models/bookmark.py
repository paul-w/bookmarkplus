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

class Bookmark(Document):
  __collection__ = 'bookmarks'
  structure = {
      'url':unicode,
      'circles':[unicode],
      'owner':unicode,
      'date_created':unicode,
      'date_last_clicked':unicode,
      'clicks':int
  }
  use_dot_notation = True
