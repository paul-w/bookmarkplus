"""
Database configuration.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from flaskext.mongokit import MongoKit
from models.bookmark import Bookmark
from models.bookmark import DEFAULT_BOOKMARK_SORT_KEY
from models.bookmark import DEFAULT_BOOKMARK_SORT_ORDER
from models.circle import Circle
from models.user import User
from pymongo.objectid import ObjectId
from utils import get_hashed_password
from utils import get_unicode_datetime

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
    Shows the contents of the current MongoDB connection. (jven)
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

  def _show_contents_lengthy(self):
    """
    Shows the contents of the current MongoDB connection. (pwoods)
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

  def user_exists(self, email):
    """
    Takes an e-mail address and checks if a User exists with that address.
    """
    return self._mk.User.find_one({'email':email}) is not None

  def get_user_and_login(self, email, raw_password):
    """
    Takes an e-mail address and password and checks if a User exists with
    this combination. Updates date_last_login if user exists, None otherwise.
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
    Returns None if no such user exists.
    """
    if type(user_id) != unicode:
      return None
    try:
      return self._mk.User.find_one(ObjectId(user_id))
    except:
      return None

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
    Takes in a user and a url and returns whether the user has a bookmark
    with the url.
    """
    return self._mk.Bookmark.find_one(
        {'owner':unicode(user_id), 'url':url}) is not None

  def click_bookmark(self, bookmark_id):
    """
    Get a bookmark and record a click for that bookmark. Returns the bookmark.
    """
    bookmark = self.get_bookmark(unicode(bookmark_id))
    assert bookmark is not None, ('ASSERTION ERROR: Attempted to click an '
        'invalid bookmark.')
    bookmark.clicks += 1
    bookmark.date_last_clicked = get_unicode_datetime()
    bookmark.save()
    return bookmark

  def get_bookmark(self, bookmark_id):
    """
    Gets the book corresponding to the given bookmark_id.
    """
    if type(bookmark_id) != unicode:
      return None
    try:
      return self._mk.Bookmark.find_one(ObjectId(bookmark_id))
    except:
      return None

  def get_all_bookmarks(self, user_id, sort_by):
    """
    Gets a user's bookmarks, sorted in the specified way. Returns an empty list
    if no such user exists.
    """
    user = self.get_user_by_id(user_id)
    if user is None:
      return []
    user.bookmark_sort_key, user.bookmark_sort_order = sort_by
    return self._mk.Bookmark.find({'owner':unicode(user_id)}).sort([sort_by])

  def make_bookmark(self, user_id, url):
    """
    Makes a bookmark for the given user with the given url.
    Requires not bookmark_exists(user, url). Returns the bookmark.
    """
    assert not self.bookmark_exists(user_id, url), ('ASSERTION ERROR: '
        'A bookmark already exists with the given URL for that user.')
    new_bookmark = self._mk.Bookmark()
    new_bookmark.url = url
    new_bookmark.owner = unicode(user_id)
    new_bookmark.date_created = get_unicode_datetime()
    new_bookmark.clicks = 0
    new_bookmark.save()
    return new_bookmark

  def delete_bookmark(self, bookmark_id):
    """
    Removes a bookmark from every circle it's in, then deletes the bookmark.
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
    Deletes the circle corresponding to the given circle_id. The bookmarks in
    the circle are not deleted.
    """
    circle = self.get_circle(circle_id)
    assert circle is not None, 'ASSERTION ERROR: No such circle exists.'
    for bookmark_id in circle.bookmarks:
      bookmark = self.get_bookmark(bookmark_id)
      bookmark.circles.remove(circle_id)
      bookmark.save()
    self._mk.Circle.collection.remove(ObjectId(circle_id))

  def circle_exists(self, user_id, name):
    """
    Takes a user and a circle name and checks if the user has a circle with
    that name.
    """
    return self._mk.Circle.find_one(
        {'owner':unicode(user_id), 'name':name}) is not None

  def get_circle(self, circle_id):
    """
    Gets the circle corresponding to the given circle_id, or None if no such
    circle exists.
    """
    if type(circle_id) != unicode:
      return None
    try:
      return self._mk.Circle.find_one(ObjectId(circle_id))
    except:
      return None

  def get_all_circles(self, user_id):
    """
    Gets a user's circles.
    """
    return self._mk.Circle.find({'owner':unicode(user_id)})

  def make_circle(self, user_id, name):
    """
    Makes a circle for the given user with the given name. Requires not
    circle_exists(user, name). Returns the circle.
    """
    assert not self.circle_exists(user_id, name), ('ASSERTION ERROR: '
        'A circle already exists for this user with that name.')
    new_circle = self._mk.Circle()
    new_circle.name = name
    new_circle.owner = unicode(user_id)
    new_circle.date_created = get_unicode_datetime()
    new_circle.save()
    return new_circle

  def edit_circle(self, user_id, name, new_name):
    """
    Changes the name of the given circle, if the new name has not already
    been taken.
    """
    assert self.circle_exists(user_id, name), ('ASSERTION ERROR: '
        'A circle with that name does not exist for this user.')
    assert not self.circle_exists(user_id, new_name), ('ASSERTION ERROR: '
        'A circle already eixsts for this user with that name.')
    circle = self._mk.Circle.find_one(
        {'owner':unicode(user_id), 'name':name})
    circle.name = new_name
    circle.save()
    return circle

  def get_bookmarks_in_circle(self, user_id, circle_id, sort_by):
    """
    Gets all the bookmarks in the circle in the specified sort order. Requires
    bookmark_exists(url) for each url in circle.bookmarks.
    """
    # TODO(jven): Make sure user owns the circle
    user = self.get_user_by_id(user_id)
    assert user is not None, 'ASSERTION ERROR: No such user exists.'
    user.bookmark_sort_key, user.bookmark_sort_order = sort_by
    circle = self.get_circle(circle_id)
    if circle is None:
      return []
    return self._mk.Bookmark.find({
        '_id': {'$in':
            [ObjectId(bookmark_id) for bookmark_id in circle.bookmarks]
        }
    }).sort([sort_by])

  def is_bookmark_in_circle(self, bookmark_id, circle_id):
    """
    Returns whether a bookmark is in a circle.
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
    Takes a bookmark and circle and adds the bookmark to the circle.
    Updates suggestions.
    """
    assert not self.is_bookmark_in_circle(bookmark_id, circle_id), (
        'ASSERTION ERROR: That bookmark is already in that circle.')
    bookmark = self.get_bookmark(bookmark_id)
    circle = self.get_circle(circle_id)
    if bookmark is None or circle is None:
      return
    bookmark.circles.append(unicode(circle_id))
    bookmark.save()
    circle.bookmarks.append(unicode(bookmark_id))
    circle.save()

  def remove_bookmark_from_circle(self, bookmark_id, circle_id):
    """
    Takes a bookmark and circle and removes the bookmark from the circle.
    """
    assert self.is_bookmark_in_circle(bookmark_id, circle_id), (
        'ASSERTION ERROR: That bookmark is not in that circle.')
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
        user_bookmarks = [u_b for u_b in user_bookmarks]
        user_urls = [u_b.url for u_b in user_bookmarks]
        for bookmark in user_bookmarks:
            same_urls = self._mk.Bookmark.find(
            {'url': bookmark.url })
            for same_url in same_urls:
                if same_url.owner == user_id:
                    continue
                for circle_id in same_url.circles:
                    circle = self.get_circle(circle_id)
                    for suggested_id in circle.bookmarks:
                        suggestion = self.get_bookmark(suggested_id)
                        if suggestion.url in user_urls:
                            continue
                        if suggestion.url in suggestions:
                            continue
                        suggestions.append(suggestion.url)
                        if len(suggestions) >= limit:
                            return suggestions

        return suggestions
