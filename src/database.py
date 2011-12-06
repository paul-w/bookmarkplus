"""
Database configuration.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from models.bookmark import DEFAULT_BOOKMARK_SORT_KEY
from models.bookmark import DEFAULT_BOOKMARK_SORT_ORDER
from utils import get_hashed_password
from utils import get_unicode_datetime
from models.bookmark import Bookmark
from models.circle import Circle
from models.user import User
from flaskext.mongokit import MongoKit
from pymongo.objectid import ObjectId

# TODO(jven): each model must be registered here
MODELS = [Bookmark, Circle, User]

class Database():
  """
  Represents a connection to a MongoDB database.
  """

  def __init__(self, app):
    """
    Takes in a Flask app and initializes a connection to a MongoDB database.
    """
    self._app = app
    self._mk = MongoKit(self._app)
    self._mk.register(MODELS)

  def _drop_contents(self):
    """
    Drops all collections in the database. Only manage.py should call this!
    """
    for database_name in self._mk.connection.database_names():
      db = self._mk.connection[database_name]
      try:
        self._mk.connection.drop_database(database_name)
      except:
        # This is a system database, leave it alone!
        pass

  def _show_contents(self):
    """
    Show the contents of the current MongoDB connection.
    """
    for database_name in self._mk.connection.database_names():
      print 'DATABASE: %s' % database_name
      db = self._mk.connection[database_name]
      for collection_name in db.collection_names():
        print 'COLLECTION: %s' % collection_name
        collection = db[collection_name]
        count = collection.count()
        if count == 1:
          print '%d document' % collection.count()
        else:
          print '%d documents' % collection.count()

  # Added for debugging 
  # TODO(pauL):  remove later
  def _show_contents_lengthy(self):
    """
    Show the contents of the current MongoDB connection.
    """
    for database_name in self._mk.connection.database_names():
      print 'DATABASE: %s\n' % database_name
      db = self._mk.connection[database_name]
      for collection_name in db.collection_names():
        print 'COLLECTION: %s' % collection_name
        collection = db[collection_name]
        count = collection.count()
        curs = collection.find()
        for row in curs:
            for key in row:
                print key, ':', row[key]
            print '\n'
                
        '''if count == 1:
          print '%d document' % collection.count()
        else:
          print '%d documents' % collection.count()
        '''

  def user_exists(self, email):
    """
    Takes in an e-mail address and checks if a User exists with that address.
    """
    return self._mk.User.find_one({'email':email}) is not None

  def get_user_and_login(self, email, raw_password):
    """
    Takes in an e-mail address and password and checks if a User exists with
    this combinatio and updates date_last_login. Returns None otherwise.
    """
    password = get_hashed_password(raw_password)
    user = self._mk.User.find_one({'email':email, 'password':password})
    if user is not None:
      user.date_last_login = get_unicode_datetime()
      user.save()
    return user

  def get_user_by_id(self, user_id):
    """
    Takes a user id (unicode) and returns the User corresponding to that id.
    A user with this user id should exist in the User table.
    """
    return self._mk.User.find_one(ObjectId(user_id))

  def make_user(self, name, email, raw_password):
    """
    Takes in a user's information and makes a document in the table
    representing the user. Requires not user_exists(email). Returns the user.
    """
    assert not self.user_exists(email), (
        'ASSERTION ERROR: User exists with email \'%s\'!' % email)
    new_user = self._mk.User()
    new_user.name = name
    new_user.email = email
    password = get_hashed_password(raw_password)
    new_user.password = password
    new_user.date_created = get_unicode_datetime()
    new_user.date_last_login = get_unicode_datetime()
    new_user.bookmark_sort_key = DEFAULT_BOOKMARK_SORT_KEY
    new_user.bookmark_sort_order = DEFAULT_BOOKMARK_SORT_ORDER
    new_user.save()
    return new_user

  def bookmark_exists(self, user_id, url):
    """
    Takes in a user and a url and checks if the user has a bookmark with the
    url.
    """
    return self._mk.Bookmark.find_one(
        {'owner':unicode(user_id), 'url':url}) is not None

  def get_suggestions(self, user_id, num):
    user = self.get_user_by_id(unicode(user_id))
    return user.suggestions

  def click_bookmark(self, bookmark_id):
    """
    Get a bookmark and record a click.
    """
    bookmark = self.get_bookmark(unicode(bookmark_id))
    assert bookmark is not None
    bookmark.clicks += 1
    bookmark.date_last_clicked = get_unicode_datetime()
    bookmark.save()
    return bookmark

  def get_bookmark(self, bookmark_id):
    """
    Get a bookmark.
    """
    if type(bookmark_id) != unicode:
      return None
    try:
      bookmark = self._mk.Bookmark.find_one(ObjectId(bookmark_id))
    except:
      # TODO(jven): catch InvalidId exception specifically
      return None
    return bookmark

  def get_all_bookmarks(self, user_id, sort_by):
    """
    Get a user's bookmarks.
    """
    user = self.get_user_by_id(user_id)
    user.bookmark_sort_key, user.bookmark_sort_order = sort_by
    return self._mk.Bookmark.find({'owner':unicode(user_id)}).sort([sort_by])

  def make_bookmark(self, user_id, url):
    """
    Makes a bookmark for the given user with the given url.
    Requires not bookmark_exists(user, url). Returns the bookmark.
    """
    assert not self.bookmark_exists(user_id, url)
    new_bookmark = self._mk.Bookmark()
    new_bookmark.url = url
    new_bookmark.owner = unicode(user_id)
    new_bookmark.date_created = get_unicode_datetime()
    new_bookmark.clicks = 0
    new_bookmark.save()
    return new_bookmark

  def delete_bookmark(self, bookmark_id):
    """
    Remove a bookmark from every circle it's in then delete the bookmark.
    """
    bookmark = self.get_bookmark(bookmark_id)
    assert bookmark is not None
    for circle_id in bookmark.circles:
      circle = self.get_circle(circle_id)
      circle.bookmarks.remove(bookmark_id)
      circle.save()
    self._mk.Bookmark.collection.remove(ObjectId(bookmark_id))

  def delete_circle(self, circle_id):
    """
    Delete the circle, but the bookmarks in the circle are not deleted.
    """
    circle = self.get_circle(circle_id)
    assert circle is not None
    for bookmark_id in circle.bookmarks:
      bookmark = self.get_bookmark(bookmark_id)
      bookmark.circles.remove(circle_id)
      bookmark.save()
    self._mk.Circle.collection.remove(ObjectId(circle_id))

  def circle_exists(self, user_id, name):
    """
    Takes in a user and a circle name and checks if the user has a circle with
    the name.
    """
    return self._mk.Circle.find_one(
        {'owner':unicode(user_id), 'name':name}) is not None

  def get_circle(self, circle_id):
    """
    Get a circle.
    """
    if type(circle_id) != unicode:
      return None
    try:
      circle = self._mk.Circle.find_one(ObjectId(circle_id))
    except:
      # TODO(jven): catch InvalidId exception specifically
      return None
    return circle

  def get_all_circles(self, user_id):
    """
    Get a user's circles.
    """
    return self._mk.Circle.find({'owner':unicode(user_id)})

  def make_circle(self, user_id, name):
    """
    Makes a circle for the given user with the given name.
    Requires not circle_exists(user, name). Returns the circle.
    """
    assert not self.circle_exists(user_id, name)
    new_circle = self._mk.Circle()
    new_circle.name = name
    new_circle.owner = unicode(user_id)
    new_circle.date_created = get_unicode_datetime()
    new_circle.save()
    return new_circle

  def get_bookmarks_in_circle(self, user_id, circle_id, sort_by):
    """
    Get all the bookmarks in the circle. Requires bookmark_exists(url)
    for each url in circle.bookmarks.
    """
    user = self.get_user_by_id(user_id)
    user.bookmark_sort_key, user.bookmark_sort_order = sort_by
    circle = self.get_circle(circle_id)
    if circle is None:
      return []
    return self._mk.Bookmark.find(
            {'_id': {'$in':[ObjectId(bookmark_id)
            for bookmark_id in circle.bookmarks] } } 
            ).sort([sort_by])

  def is_bookmark_in_circle(self, bookmark_id, circle_id):
    """
    Checks if a bookmark is in a circle.
    """
    bookmark = self.get_bookmark(bookmark_id)
    circle = self.get_circle(circle_id)
    if bookmark is None or circle is None:
      return False
    if (unicode(bookmark._id) in circle.bookmarks or
        unicode(circle._id) in bookmark.circles):
      return True
    else:
      return False

  def add_bookmark_to_circle(self, bookmark_id, circle_id):
        """
        Takes in a bookmark and circle and adds the bookmark to the circle.
        """
        assert not self.is_bookmark_in_circle(bookmark_id, circle_id)
        bookmark = self.get_bookmark(bookmark_id)
        circle = self.get_circle(circle_id)
        if bookmark is None or circle is None:
          return
        bookmark.circles.append(unicode(circle_id))
        bookmark.save()
        circle.bookmarks.append(unicode(bookmark_id))
        circle.save()
        self.update_suggestions(bookmark_id, circle_id)

  def remove_bookmark_from_circle(self, bookmark_id, circle_id):
    """
    Takes in a bookmark and circle and removes the bookmark from the circle.
    """
    # TODO(mikemeko): this code is repeated a lot, we should write helpers
    assert self.is_bookmark_in_circle(bookmark_id, circle_id)
    bookmark = self.get_bookmark(bookmark_id)
    circle = self.get_circle(circle_id)
    if bookmark is None or circle is None:
      return
    bookmark.circles.remove(unicode(circle_id))
    bookmark.save()
    circle.bookmarks.remove(unicode(bookmark_id))
    circle.save()

  def get_suggestions(self, user_id, limit):
        suggestions = []
        user_id = unicode(user_id)
        if limit == 0:
            return suggestions

        user_bookmarks = self._mk.Bookmark.find(
                {'owner':user_id})
        for bookmark in user_bookmarks:
            same_urls = self._mk.Bookmark.find(
            {'url': bookmark.url })
            for same_url in same_urls:
                if same_url.owner == user_id:
                    print '\nTrue\n'
                    continue
                print 'sameurlcircles', same_url.circles
                for circle_id in same_url.circles:
                    print 'circle_id', circle_id
                    circle = self.get_circle(circle_id)
                    for suggested_id in circle.bookmarks:
                        suggestion = self.get_bookmark(suggested_id)
                        suggestions.append(suggestion.url)
                        print 'suggestions', suggestions
                        if len(suggestions) >= limit:
                            return suggestions

        return suggestions
