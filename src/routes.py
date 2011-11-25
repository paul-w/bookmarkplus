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
from flask import render_template
from flask import url_for
from flaskext.mongokit import MongoKit

app = Flask(__name__)
app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
app.config['MONGODB_HOST'] = MONGODB_HOST
app.config['MONGODB_PORT'] = MONGODB_PORT
db = Database(app)

@app.route('/', methods=['GET'])
def home():
  return render_template('html/landing.html')

@app.route('/landing_js.js', methods=['GET'])
def landing_js():
  return render_template('js/landing.js',
      message='This is the landing page!')

# TODO(jven): This is just an example of using database.py.
@app.route('/register/<name>/<email>', methods=['GET'])
def register(name, email):
  user_exists = db.user_exists(email)
  if user_exists:
    return 'User with e-mail \'%s\' exists!' % email
  user = db.make_user(name, email, u'password')
  return 'Hi, %s!' % user.name


# methods related to interaction with main.js

@app.route('/bookmarks', methods = ['POST'])
def create_bookmark():
    pass

@app.route('/bookmarks/<url>', methods = ['DELETE'])
def delete_bookmark():
    pass

@app.route('/bookmarks/<url>', methods = ['PUT'])
def update_bookmark():
    pass

@app.route('/circles', methods = ['POST'])
def create_circle():
    pass

@app.route('/circles', methods = ['GET'])
def get_circles():
    pass

@app.route('/circles/<id>', methods = ['DELETE'])
def delete_circle():
    pass

@app.route('/circles/<id>', methods = ['PUT'])
def update_circle():
    pass

# for now, as if circles have bookmarks (as opposed to other way around)
@app.route('/circles/<id>/bookmarks', methods = ['POST'])
def add_bookmark_to_circle():
    pass

@app.route('/circles/<id>/bookmarks', methods = ['GET'])
def get_bookmarks_given_circle():
    pass

@app.route('/circles/bookmarks/<url>', methods = ['DELETE'])
def remove_bookmark_from_circle():
    pass



