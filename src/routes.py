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
from flaskext.mongokit import MongoKit

app = Flask(__name__)
app.config['MONGODB_DATABASE'] = MONGODB_DATABASE
app.config['MONGODB_HOST'] = MONGODB_HOST
app.config['MONGODB_PORT'] = MONGODB_PORT
db = Database(app)

@app.route('/', methods=['GET'])
def home():
  return 'Hello world!'

# TODO(jven): This is just an example of using database.py.
@app.route('/register/<name>/<email>', methods=['GET'])
def register(name, email):
  user_exists = db.user_exists(email)
  if user_exists:
    return 'User with e-mail \'%s\' exists!' % email
  user = db.make_user(name, email, u'password')
  return 'Hi, %s!' % user.name
