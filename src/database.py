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
from models.suggestion import Suggestion
from models.user import User
from flaskext.mongokit import MongoKit
from pymongo.objectid import ObjectId

# TODO(jven): each model must be registered here
MODELS = [Bookmark, Circle, User, Suggestion]

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

  def get_suggestions(self, bookmark_id):
    bookmark = self.get_bookmark(unicode(bookmark_id))
    if bookmark:
        url = bookmark.url
        return self._mk.Suggestion.find({'url':unicode(url)}).sort(
                                    [('score', -1)])
    else:
        return []


  def suggestion_score(self, suggested_bookmark):
    score = 1.0 / len(suggested_bookmark.circles)
    return score

  def update_suggestion_scores(self, suggested_bookmark):
    suggested_url = suggested_bookmark.url
    for circle_id in suggested_bookmark.circles:
        circle = self.get_circle(circle_id)
        for bookmark_id in circle.bookmarks:
            bookmark = self.get_bookmark(bookmark_id)
            url = bookmark.url
            if url==suggested_url:
                continue
            score_change = self.suggestion_score(suggested_bookmark)
            suggestion = self._mk.Suggestion.find_one(
                   {'url': url, 'suggestion': suggested_url })
            if suggestion is not None:
                suggestion.score += score_change
                suggestion.save()
            else:
                new_suggestion = self._mk.Suggestion()
                new_suggestion.url = url
                new_suggestion.suggestion = suggested_url
                new_suggestion.score = score_change
                new_suggestion.save()
                


  def click_bookmark(self, bookmark_id):
    """
    Get a bookmark and record a click.
    """
    bookmark = self.get_bookmark(unicode(bookmark_id))
    assert bookmark is not None
    bookmark.clicks += 1
    bookmark.date_last_clicked = get_unicode_datetime()
    bookmark.save()
    self.update_suggestion_scores(bookmark)
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
      print circle_id
      circle = self.get_circle(circle_id)
      circle.bookmarks.remove(bookmark_id)
      circle.save()
    self._mk.Bookmark.collection.remove(ObjectId(bookmark_id))

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
    # TODO(mikemeko, pauL): pauL, this is buggy and I could not figure out
    # how to fix it, so I have replaced it by what we had before.
    # Error: Bookmark object has no sort method
    return [self._mk.Bookmark.find_one(ObjectId(bookmark_id))
            for bookmark_id in circle.bookmarks]
#    return [self._mk.Bookmark.find_one(ObjectId(bookmark_id)).sort([sort_by])
#            for bookmark_id in circle.bookmarks]

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
