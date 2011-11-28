"""
Database configuration.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from datetime import datetime
from utils import get_hashed_password
from models.bookmark import Bookmark
from models.circle import Circle
from models.user import User
from flaskext.mongokit import MongoKit

# TODO(jven): each model must be registered here
MODELS = [User]

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

  def user_exists(self, email):
    """
    Takes in an e-mail address and checks if a User exists with that address.
    """
    return self._mk.User.find_one({'email':email}) is not None

  def get_user_and_login(self, email, password):
    """
    Takes in an e-mail address and password and checks if a User exists with
    this combinatio and updates date_last_login. Returns None otherwise.
    """
    user = self._mk.User.find_one({'email':email, 'password':password})
    if user is not None:
      user.date_last_login = datetime.utcnow()
      user.save()
    return user

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
    new_user.save()
    return new_user

  def bookmark_exists(self, user_id, url):
    """
    Takes in a user and a url and checks if the user has a bookmark with the
    url.
    """
    return self._mk.Bookmark.find_one(
        {'owner':user_id, 'url':url}) is not None

  def get_bookmark_and_click(self, user_id, url):
    """
    Get a bookmark and record a click.
    """
    bookmark = self._mk.Bookmark.find_one(
        {'owner':user_id, 'url':url})
    if bookmark is not None:
      bookmark.clicks += 1
      bookmark.date_last_clicked = datetime.utcnow()
      bookmark.save()
    return bookmark

  def get_all_bookmarks(self, user_id):
    """
    Get a user's bookmarks.
    """
    return self._mk.Bookmark.find({'owner':user_id})

  def make_bookmark(self, user_id, url):
    """
    Makes a bookmark for the given user with the given url.
    Requires not bookmark_exists(user, url). Returns the bookmark.
    """
    assert not self.bookmark_exists(user_id, url)
    new_bookmark = self._mk.Bookmark()
    new_bookmark.url = url
    new_bookmark.owner = user_id
    new_bookmark.save()
    return new_bookmark

  def circle_exists(self, user_id, name):
    """
    Takes in a user and a circle name and checks if the user has a circle with
    the name.
    """
    return self._mk.Circle.find_one(
        {'owner':user_id, 'name':name}) is not None

  def get_circle(self, user_id, name):
    """
    Get a circle.
    """
    return self._mk.Circle.find_one(
        {'owner':user_id, 'name':name})

  def get_all_circles(self, user_id):
    """
    Get a user's circles.
    """
    return self._mk.Circle.find({'owner':user_id})

  def make_circle(self, user_id, name):
    """
    Makes a circle for the given user with the given name.
    Requires not circle_exists(user, name). Returns the circle.
    """
    assert not self.circle_exists(user_id, name)
    new_circle = self._mk.Circle()
    new_circle.name = name
    new_circle.owner = user_id
    new_circle.save()
    return new_circle

  def get_bookmarks_in_circle(self, circle):
    """
    Get all the bookmarks in the circle.
    """
    return [self._mk.Bookmark.find_one(
        bookmark_id) for bookmark_id in circle.bookmarks]

  def add_bookmark_to_circle(self, bookmark, circle):
    """
    Takes in a bookmark and circle and adds the bookmark to the circle.
    """
    bookmark.circles.append(circle._id)
    bookmark.save()
    circle.bookmarks.append(bookmark._id)
    circle.save()
