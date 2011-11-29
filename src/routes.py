"""
Request router for amphoros.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from config import MONGODB_DATABASE
from config import MONGODB_HOST
from config import MONGODB_PORT
from database import Database
from flask import Flask
from flask import g
from flask import jsonify
from flask import redirect
from flask import render_template
from flask import request
from flask import session
from flask import url_for
from flaskext.mongokit import MongoKit
from models.forms import AddBookmarkToCircleForm
from models.forms import CreateBookmarkForm
from models.forms import CreateCircleForm
from utils import check_email
from utils import check_name
from utils import check_password

app = Flask(__name__)
app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
app.config['MONGODB_HOST'] = MONGODB_HOST
app.config['MONGODB_PORT'] = MONGODB_PORT

# TODO(pauL):  make more secret
app.secret_key = (
'\xa5\xee\xd4\x1a\\\x8aQ\xa4\x1a\xa5\x9f\xe3\xdeT=\xb5\xbd\xa6\x93\xb3\x9a')

db = Database(app)

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
      # TODO(mikemeko): this is an example, remove
      print "hi", g.user.name

@app.teardown_request
def teardown_request(exception):
  pass

@app.route('/', methods=['GET'])
def home():
  """
  Home page.
  """
  if "user_id" in session:
    return redirect(url_for('main'))
  else:
    return redirect(url_for('landing'))

# JS templates

@app.route('/landing_js.js', methods=['GET'])
def landing_js():
  return render_template('js/landing.js',
      message='This is the landing page!')

@app.route('/main_js.js', methods=['GET'])
def main_js():
  return render_template('js/main.js',
      message='This is the main page!')

@app.route('/adts_js.js', methods=['GET'])
def adts_js():
  return render_template('js/adts.js')

# Routes

@app.route('/landing', methods=['GET'])
def landing():
  """
  Landing page for login and register.
  """
  return render_template('html/landing.html')

@app.route('/logout_html.html', methods=['GET'])
def logout_html():
  session.pop("user_id")
  return redirect(url_for('landing'))

@app.route('/main', methods=['GET'])
def main():
  return render_template('html/main.html')

# TODO(jven): This is just an example of using database.py.
@app.route('/register/<name>/<email>', methods=['POST'])
def register(name, email):
  user_exists = db.user_exists(email)
  if user_exists:
    return 'User with e-mail \'%s\' exists!' % email
  user = db.make_user(name, email, u'password')
  return 'Hi, %s!' % user.name

@app.route('/login', methods=['POST'])
def login():
  """
  Handle a user login attempt.
  """
  email = request.form["email"]
  password = request.form["password"]

  if not db.user_exists(email):
    error = "unknown e-mail"
    return jsonify({"type": "error", "error": error})

  user = db.get_user_and_login(email, password)
  if user == None:
    error = "incorrect password"
    return jsonify({"type": "error", "error": error})

  session["user_id"] = unicode(user._id)
  return jsonify({"type": "redirect", "url": url_for("main")})

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

  session["user_id"] = unicode(user._id)
  return jsonify({"type": "redirect", "url": url_for("main")})

@app.route("/help", methods = ["GET"])
def help():
  """
  Help page.
  """
  return render_template("html/help.html")

# methods related to interaction with main.js
@app.route('/createbookmark', methods = ['POST'])
def create_bookmark():
  # update to database
  uri = request.form.get('uri')
  db.make_bookmark(session['user_id'], uri)
  return uri

@app.route('/createcircle', methods = ['POST'])
def create_circle():
  name = request.form.get('name')
  db.make_circle(session['user_id'], name)
  return name

@app.route('/addbookmarktocircle', methods = ['POST'])
def add_bookmark_to_circle():
  bookmark_id = request.form.get('bookmark_id')
  circle_id = request.form.get('circle_id')
  db.add_bookmark_to_circle(bookmark_id, circle_id)
  return 'sup'

@app.route('/getcircles', methods = ['GET'])
def get_circles():
  return jsonify(circles=[{
      'id':unicode(circle._id),
      'name':circle.name,
      'bookmarks':circle.bookmarks
      } for circle in db.get_all_circles(session['user_id'])])

@app.route('/getbookmarks', methods = ['GET'])
def get_bookmarks():
  return jsonify(bookmarks=[{
      'id':unicode(bookmark._id),
      'url':bookmark.url,
      'circles':bookmark.circles
      } for bookmark in db.get_all_bookmarks(session['user_id'])])
