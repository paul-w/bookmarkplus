"""
Request router for amphoros.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

import os
from config import MONGODB_DATABASE
from config import MONGODB_HOST
from config import MONGODB_PASSWORD
from config import MONGODB_PORT
from config import MONGODB_USERNAME
from config import SECRET_KEY
from database import Database
from flask import flash
from flask import Flask
from flask import g
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import request
from flask import send_from_directory
from flask import session
from flask import url_for
from flaskext.mongokit import MongoKit
from functools import wraps
from models.bookmark import BOOKMARK_SORT_OPTIONS
from models.bookmark import BOOKMARK_SORT_OPTIONS_REVERSE
from utils import NUM_SUGGESTIONS
from utils import check_email
from utils import check_name
from utils import check_password

app = Flask(__name__)
app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
app.config['MONGODB_HOST'] = MONGODB_HOST
app.config['MONGODB_PORT'] = MONGODB_PORT
#app.config['MONGODB_USERNAME'] = MONGODB_USERNAME
#app.config['MONGODB_PASSWORD'] = MONGODB_PASSWORD
app.config['SECRET_KEY'] = SECRET_KEY
db = Database(app)

#####################
##                 ##
## Utility Methods ##
##                 ##
#####################

def access_denied():
  """
  Returns response when a user not logged in makes a request that requires
  login.
  """
  return jsonify({'type': 'error', 'message': 'You are not logged in.'})

def requires_login(f):
  """
  Returns a function to be called when a request calls the given function
  via a request.
  """
  @wraps(f)
  def decorated(*args, **kwargs):
    if g.user is None:
       return access_denied()
    return f(*args, **kwargs)
  return decorated

@app.before_request
def before_request():
  """
  Checks if the user is logged in before handling the request, sets g.user
  if so.
  """
  if "user_id" in session:
    g.user = db.get_user_by_id(session.get("user_id"))
    if g.user is None:
      session.pop('user_id', None)
  else:
    g.user = None

##########################
##                      ##
## Javascript Templates ##
##                      ##
##########################

@app.route('/favicon.ico', methods=['GET'])
def favicon():
  """
  Returns the favicon.
  """
  return send_from_directory(os.path.join(app.root_path, 'static', 'img'),
      'favicon.ico', mimetype='image/vnd.microsoft.icon')

##########################
##                      ##
## Javascript Templates ##
##                      ##
##########################

@app.route('/landing.js', methods=['GET'])
def landing_js():
  """
  Renders and returns the landing page JavaScript.
  """
  return render_template('js/landing.js')

@app.route('/main.js', methods=['GET'])
@requires_login
def main_js():
  """
  Renders and returns the main page JavaScript.
  """
  bookmark_sort_options = []
  for option in BOOKMARK_SORT_OPTIONS.values():
    bookmark_sort_options.append(option)
  return render_template('js/main.js',
      bookmark_sort_options = bookmark_sort_options,
      bookmark_sort_key = BOOKMARK_SORT_OPTIONS[
          g.user.bookmark_sort_key],
      bookmark_sort_order = g.user.bookmark_sort_order)

@app.route('/util.js', methods=['GET'])
def util_js():
  """
  Renders and returns the util JavaScript.
  """
  return render_template('js/util.js')

####################
##                ##
## HTML Templates ##
##                ##
####################

@app.route('/', methods=['GET'])
def home():
  """
  Returns the landing page for users not logged in and the main page for users
  logged in.
  """
  if g.user is not None:
    return render_template('html/main.html')
  else:
    return render_template('html/landing.html')

@app.route('/logout', methods=['GET'])
def logout():
  """
  Logs out the user if a user is logged in. In any case, redirects to the home
  (landing) page.
  """
  if g.user is not None:
    flash("Goodbye %s" % g.user.name)
    session.pop("user_id")
  return redirect(url_for('home'))

##################
##              ##
## AJAX Methods ##
##              ##
##################

@app.route('/login', methods=['POST'])
def login():
  """
  Attempts to log in the user with the given credentials.
  """
  if g.user is not None:
    error = "You are already logged in."
    return jsonify({"type": "error", "error": error})
  email = request.form["email"]
  password = request.form["password"]
  if not db.user_exists(email):
    error = "unknown e-mail"
    return jsonify({"type": "error", "error": error})
  user = db.get_user_and_login(email, password)
  if user == None:
    error = "incorrect password"
    return jsonify({"type": "error", "error": error})
  flash("Welcome %s" % user.name)
  session["user_id"] = unicode(user._id)
  return jsonify({"type": "redirect", "url": url_for("home")})

@app.route('/register', methods=['POST'])
def register():
  """
  Attempts to register the user with the given account information.
  """
  name = request.form["name"]
  email = request.form["email"]
  password = request.form["password"]
  repassword = request.form["repassword"]
  name_error = check_name(name)
  if name_error != None:
    # malformed name
    return jsonify({"type": "error", "error": name_error})
  email_error = check_email(email)
  if email_error != None:
    # malformed e-mail
    return jsonify({"type": "error", "error": email_error})
  password_error = check_password(password, repassword)
  if password_error != None:
    # malformed password
    return jsonify({"type": "error", "error": password_error})
  user_exists = db.user_exists(email)
  if user_exists:
    # user with this e-mail already exists
    error = "a user with this e-mail already exists"
    return jsonify({"type": "error", "error": error})
  user = db.make_user(name, email, password)
  flash("Welcome to Bookmark+ %s!" % user.name)
  session["user_id"] = unicode(user._id)
  return jsonify({"type": "redirect", "url": url_for("home")})

@app.route('/is_logged_in', methods=['POST'])
def is_logged_in():
  """
  Returns whether the user is logged in. Used by the chrome extension.
  """
  if g.user is not None:
    return jsonify({"logged_in": True, "name": g.user.name,
        "email": g.user.email})
  else:
    return jsonify({"logged_in": False})

@app.route('/createbookmark', methods = ['POST'])
@requires_login
def create_bookmark():
  """
  Creates a bookmark with the specified url.
  """
  uri = request.form.get('uri')
  # TODO(jven): better validation
  if not uri:
    return jsonify({'type':'error', 'message':'Invalid URL.'})
  if '://' not in uri:
    uri = 'http://%s' % uri
  if db.bookmark_exists(session['user_id'], uri):
    return jsonify({'type':'error', 'message':'A bookmark with that URL '
        'already exists.'})
  new_bookmark = db.make_bookmark(session['user_id'], uri)
  return jsonify({'type':'success', 'bookmark_id':unicode(new_bookmark._id)})

@app.route('/deletebookmark', methods = ['POST'])
@requires_login
def delete_bookmark():
  """
  Deletes the bookmark with the specified bookmark_id.
  """
  bookmark_id = request.form.get('bookmark_id')
  # TODO(jven): better validation, make sure user owns this bookmark
  if not bookmark_id or db.get_bookmark(bookmark_id) is None:
    return jsonify({'type':'error', 'message':'Invalid bookmark ID.'})
  db.delete_bookmark(bookmark_id)
  return jsonify({'type':'success'})

@app.route('/deletecircle', methods = ['POST'])
@requires_login
def delete_circle():
  """
  Deletes the circle with the specified circle_id.
  """
  circle_id = request.form.get('circle_id')
  # TODO(mikemeko, jven): better validation
  if not circle_id or db.get_circle(circle_id) is None:
    return jsonify({'type':'error', 'message':'Invalid circle ID.'})
  db.delete_circle(circle_id)
  return jsonify({'type':'success'})

@app.route('/createcircle', methods = ['POST'])
@requires_login
def create_circle():
  """
  Creates a circle with the given circle name.
  """
  name = request.form.get('name')
  # TODO(jven): better validation
  if not name:
    return jsonify({'type':'error', 'message':'Invalid circle name.'})
  if db.circle_exists(session['user_id'], name):
    return jsonify({'type':'error', 'message':'A circle with that name '
        'already exists.'})
  new_circle = db.make_circle(session['user_id'], name)
  return jsonify({'type':'success', 'circle_id':unicode(new_circle._id)})

@app.route('/isbookmarkincircle', methods = ['POST'])
@requires_login
def is_bookmark_in_circle():
  """
  Returns whether the bookmark is in the given circle.
  """
  # TODO(mikemeko): this code is repeated a lot, we should write helpers
  bookmark_id = request.form.get('bookmark_id')
  circle_id = request.form.get('circle_id')
  if not bookmark_id or db.get_bookmark(bookmark_id) is None:
    return jsonify({'type':'error', 'message':'Invalid bookmark ID.'})
  if not circle_id or db.get_circle(circle_id) is None:
    return jsonify({'type':'error', 'message':'Invalid circle ID.'})
  bookmark_in_circle = db.is_bookmark_in_circle(bookmark_id, circle_id)
  return jsonify({'bookmark_in_circle':bookmark_in_circle})

@app.route('/addbookmarktocircle', methods = ['POST'])
@requires_login
def add_bookmark_to_circle():
  """
  Adds the bookmark to the given circle.
  """
  bookmark_id = request.form.get('bookmark_id')
  circle_id = request.form.get('circle_id')
  # TODO(jven): better validation, make sure user owns these things
  if not bookmark_id or db.get_bookmark(bookmark_id) is None:
    return jsonify({'type':'error', 'message':'Invalid bookmark ID.'})
  if not circle_id or db.get_circle(circle_id) is None:
    return jsonify({'type':'error', 'message':'Invalid circle ID.'})
  if db.is_bookmark_in_circle(bookmark_id, circle_id):
    return jsonify({'type':'error', 'message':'That bookmark is already in '
        'that circle.'})
  db.add_bookmark_to_circle(bookmark_id, circle_id)
  return jsonify({'type':'success'})

@app.route('/removebookmarkfromcircle', methods = ['POST'])
@requires_login
def remove_bookmark_from_circle():
  """
  Removes the bookmark from the given circle.
  """
  # TODO(mikemeko): this code is repeated a lot, we should write helpers
  bookmark_id = request.form.get('bookmark_id')
  circle_id = request.form.get('circle_id')
  if not bookmark_id or db.get_bookmark(bookmark_id) is None:
    return jsonify({'type':'error', 'message':'Invalid bookmark ID.'})
  if not circle_id or db.get_circle(circle_id) is None:
    return jsonify({'type':'error', 'message':'Invalid circle ID.'})
  if not db.is_bookmark_in_circle(bookmark_id, circle_id):
    return jsonify({'type':'error', 'message':'That bookmark is noy in that '
        'circle.'})
  db.remove_bookmark_from_circle(bookmark_id, circle_id)
  return jsonify({'type':'success'})

@app.route('/getcircles', methods = ['POST'])
@requires_login
def get_circles():
  """
  Returns the circles of the current user.
  """
  return jsonify(circles=[{
      'id':unicode(circle._id),
      'name':circle.name,
      'bookmarks':circle.bookmarks
  } for circle in db.get_all_circles(session['user_id'])])

@app.route('/getbookmarks', methods = ['POST'])
@requires_login
def get_bookmarks():
  """
  Returns the bookmarks. Filters by circle if a circle_id is given.
  """
  user_id = session.get('user_id')
  circle_id = request.form.get('circle_id')
  sort_by = request.form.get('sort_by')
  ascending = request.form.get('ascending')
  sort_params = (BOOKMARK_SORT_OPTIONS_REVERSE[sort_by], int(ascending))
  if not circle_id:
    bookmarks = db.get_all_bookmarks(user_id, sort_params)
  else:
    bookmarks = db.get_bookmarks_in_circle(user_id, circle_id, sort_params)
  return jsonify(bookmarks=[{
      'id':unicode(bookmark._id),
      'url':bookmark.url,
      'circles':bookmark.circles
  } for bookmark in bookmarks])

@app.route('/getsuggestions', methods = ['POST'])
@requires_login
def get_suggestions():
  """
  Returns the suggestions for the current user.
  """
  num_sugg = int(request.form.get('num_sugg'))
  user_id = session.get('user_id')
  suggestions = db.get_suggestions(user_id, num_sugg)
  return jsonify(suggestions=[{
      'url':suggestion,
  } for suggestion in suggestions])

@app.route('/click', methods = ['POST'])
@requires_login
def click():
  """
  Records a click for the given bookmark.
  """
  bookmark_id = request.form.get('bookmark_id')
  db.click_bookmark(bookmark_id)
  return jsonify({'type':'success'})
