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
from flask import Flask, request, jsonify
from flask import render_template
from flask import url_for
from flask import session
from flaskext.wtf import Form, TextField, validators
from flaskext.mongokit import MongoKit
from models.forms import CreateBookmarkForm, CreateCircleForm, AddBookmarkToCircleForm

app = Flask(__name__)
app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
app.config['MONGODB_HOST'] = MONGODB_HOST
app.config['MONGODB_PORT'] = MONGODB_PORT

# TODO(pauL):  make more secret
app.secret_key = ( 
'\xa5\xee\xd4\x1a\\\x8aQ\xa4\x1a\xa5\x9f\xe3\xdeT=\xb5\xbd\xa6\x93\xb3\x9a' )

db = Database(app)

@app.route('/', methods=['GET'])
def home():
  return render_template('html/landing.html')

@app.route('/landing_js.js', methods=['GET'])
def landing_js():
  return render_template('js/landing.js',
      message='This is the landing page!')


# added for main
@app.route('/main_js.js', methods=['GET'])
def main_js():
  return render_template('js/main.js', 
      message='This is the main page!')

@app.route('/adts_js.js', methods=['GET'])
def adts_js():
  return render_template('js/adts.js')

@app.route('/logout_html.html', methods=['GET'])
def logout_html():
  return render_template('html/landing.html')




@app.route('/main', methods=['GET'])
def main():
  # TODO(pauL): take out once user session finished 
  session['user_id'] = 0 
  # added for testing of main.js
  create_bookmark_form = CreateBookmarkForm(request.form)
  create_circle_form = CreateCircleForm(request.form)
  add_bookmark_to_circle_form = AddBookmarkToCircleForm(request.form)
  return render_template('html/main.html', 
        create_bookmark_form = create_bookmark_form,
        create_circle_form = create_circle_form,
        add_form = add_bookmark_to_circle_form
  )
     

# TODO(jven): This is just an example of using database.py.
@app.route('/register/<name>/<email>', methods=['GET'])
def register(name, email):
  user_exists = db.user_exists(email)
  if user_exists:
    return 'User with e-mail \'%s\' exists!' % email
  user = db.make_user(name, email, u'password')
  return 'Hi, %s!' % user.name


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
  uri = request.form.get('uri')
  name = request.form.get('name')
  return uri + name

@app.route('/getcircles', methods = ['GET'])
def get_circles():
    circles = db.get_all_bookmarks(session['user_id'])
    return jsonify(circles)

    '''
    # for testing
    circles = {}
    for i in xrange(10):
        circles[i] = ('Circle' + str(i))
    return jsonify(circles)  
    '''


@app.route('/getbookmarks', methods = ['GET'])
def get_bookmarks():
   
    bookmarks = db.get_all_bookmarks(session['user_id'])
    return jsonify(bookmarks)

    '''
    # for testing
    bookmarks = {}
    for i in xrange(12):
        bookmarks[i] = ('http://www.google.com/search?hl=en&q='+str(i))
    return jsonify(bookmarks)  
    '''
