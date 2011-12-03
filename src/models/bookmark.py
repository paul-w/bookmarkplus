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

BOOKMARK_SORT_OPTIONS = {
        unicode('url') : 'URL',
            unicode('clicks'): 'TotalVisits',
                unicode('date_last_clicked'): 'LastVisited'
}

BOOKMARK_SORT_OPTIONS_REVERSE =  dict(
    [(val, key) for (key, val) in BOOKMARK_SORT_OPTIONS.iteritems()]) 

# for now, the first option is the default
DEFAULT_BOOKMARK_SORT_KEY = BOOKMARK_SORT_OPTIONS.keys()[0]

# descending by default
DEFAULT_BOOKMARK_SORT_ORDER = -1

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

