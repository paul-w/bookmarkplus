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
from config import MONGODB_PORT
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
app.config['SECRET_KEY'] = SECRET_KEY

db = Database(app)

#####################
##                 ##
## Utility Methods ##
##                 ##
#####################

def access_denied():
  """Adapted from tipster example"""
  return jsonify({'type': 'error', 'message': 'You are not logged in.'})

def requires_login(f):
  """Decorator to be applied to actions that require login."""
  @wraps(f)
  def decorated(*args, **kwargs):
    if g.user is None:
       return access_denied()
    return f(*args, **kwargs)
  return decorated

@app.before_request
def before_request():
  """
  If a user is logged in, store the current User in g using user id in session.
  """
  if "user_id" in session:
    g.user = db.get_user_by_id(session.get("user_id"))
    if g.user is None:
      session.pop('user_id', None)
  else:
    g.user = None

@app.teardown_request
def teardown_request(exception):
  pass

##########################
##                      ##
## Javascript Templates ##
##                      ##
##########################

@app.route('/favicon.ico', methods=['GET'])
def favicon():
  return send_from_directory(os.path.join(app.root_path, 'static', 'img'),
      'favicon.ico', mimetype='image/vnd.microsoft.icon')

##########################
##                      ##
## Javascript Templates ##
##                      ##
##########################

@app.route('/landing_js.js', methods=['GET'])
def landing_js():
  return render_template('js/landing.js')

@app.route('/main_js.js', methods=['GET'])
@requires_login
def main_js():
  bookmark_sort_options = []
  for option in BOOKMARK_SORT_OPTIONS.values():
      bookmark_sort_options.append(option)

  return render_template('js/main.js',
            bookmark_sort_options = bookmark_sort_options,
            bookmark_sort_key = BOOKMARK_SORT_OPTIONS[
                                    g.user.bookmark_sort_key],
            bookmark_sort_order = g.user.bookmark_sort_order
            )

@app.route('/util_js.js', methods=['GET'])
def util_js():
  return render_template('js/util.js')

####################
##                ##
## HTML Templates ##
##                ##
####################

@app.route('/', methods=['GET'])
def home():
  """
  If user is logged in, returns the main page. If not, returns the landing
  page.
  """
  if g.user is not None:
    return render_template('html/main.html')
  else:
    return render_template('html/landing.html')

##################
##              ##
## AJAX Methods ##
##              ##
##################

@app.route('/logout', methods=['GET'])
def logout():
  if g.user is not None:
    flash("Goodbye %s" % g.user.name)
    session.pop("user_id")
  return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
  """
  Handle a user login attempt.
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
  Handle a user register attempt.
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
  bookmark_id = request.form.get('bookmark_id')
  # TODO(jven): better validation, make sure user owns this bookmark
  if not bookmark_id or db.get_bookmark(bookmark_id) is None:
    return jsonify({'type':'error', 'message':'Invalid bookmark ID.'})
  db.delete_bookmark(bookmark_id)
  return jsonify({'type':'success'})

@app.route('/deletecircle', methods = ['POST'])
@requires_login
def delete_circle():
  circle_id = request.form.get('circle_id')
  # TODO(mikemeko, jven): better validation
  if not circle_id or db.get_circle(circle_id) is None:
    return jsonify({'type':'error', 'message':'Invalid circle ID.'})
  db.delete_circle(circle_id)
  return jsonify({'type':'success'})

@app.route('/createcircle', methods = ['POST'])
@requires_login
def create_circle():
  name = request.form.get('name')
  # TODO(jven): better validation
  if not name:
    return jsonify({'type':'error', 'message':'Invalid circle name.'})
  if db.circle_exists(session['user_id'], name):
    return jsonify({'type':'error', 'message':'A circle with that name '
        'already exists.'})
  new_circle = db.make_circle(session['user_id'], name)
  return jsonify({'type':'success', 'circle_id':unicode(new_circle._id)})

@app.route('/addbookmarktocircle', methods = ['POST'])
@requires_login
def add_bookmark_to_circle():
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

@app.route('/getcircles', methods = ['POST'])
@requires_login
def get_circles():
  return jsonify(circles=[{
      'id':unicode(circle._id),
      'name':circle.name,
      'bookmarks':circle.bookmarks
  } for circle in db.get_all_circles(session['user_id'])])

@app.route('/getbookmarks', methods = ['POST'])
@requires_login
def get_bookmarks():
  user_id = session.get('user_id')
  circle_id = request.form.get('circle_id')
  sort_by = request.form.get('sort_by')
  ascending = request.form.get('ascending')
  sort_params = (
    BOOKMARK_SORT_OPTIONS_REVERSE[sort_by], int(ascending))  
     
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
  num_sugg = int(request.form.get('num_sugg'))
  user_id = session.get('user_id')
  suggestions = db.get_suggestions(unicode(user_id), num_sugg)
  print [s for s in suggestions]
  return jsonify(suggestions=[{
      'url':suggestion,
  } for suggestion in suggestions])


@app.route('/click', methods = ['POST'])
@requires_login
def click():
    bookmark_id = request.form.get('bookmark_id')
    db.click_bookmark(bookmark_id)
    return jsonify({'type':'success'})
