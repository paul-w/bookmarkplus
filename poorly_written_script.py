#!/usr/bin/python

# See http://flask.pocoo.org/docs/testing .

from werkzeug import script

import random
import os
import unittest
import tempfile
import json

from src.database import Database
from src.routes import app

from src.routes import app
from src.database import Database



import manage
#manage.initdb()

pokemon = [
'Pikachu',
'Bulbasaur',
'Venasaur',
'Mudkip',
'Snorlax',
]

awesome = pokemon[0:3]
not_awesome = pokemon[2:5]


class FlaskrTestCase(unittest.TestCase):
  def setUp(self):
    self.app = app.test_client()
    self.db = Database(app)
    self.generate_test_db()

  def tearDown(self):
    pass

  def test_sorting(self):
    print '\n'

  def generate_test_db(self):
    ladygaga = self.db.make_user(
        unicode('Lady Gaga'), 
        unicode('ladygaga@hausofgaga.com'), 
        unicode('discostick') )
    user_id = ladygaga._id

    self.db._drop_contents()  
    awesome_circle = self.db.make_circle(user_id, unicode('awesome'))
    not_awesome_circle = self.db.make_circle(user_id, unicode('not_awesome'))
    bookmarks = []
    for p in pokemon:
        book = self.db.make_bookmark(
                    user_id, unicode(p+'.com'))
        bookmarks.append(book)
        if p in awesome:
            self.db.add_bookmark_to_circle(unicode(book._id), unicode(awesome_circle._id))
        if p in not_awesome:
            self.db.add_bookmark_to_circle(unicode(book._id), unicode(not_awesome_circle._id))
   
    random.seed(hash('pikachu'))
    click_store = []

    for b in bookmarks:
        print b._id
        clicks = random.randint(0, 100)
        click_store.append(clicks)
        for i in xrange(clicks): 
            self.db.click_bookmark(b._id) 

    self.db._show_contents_lengthy()

    for b in bookmarks:
        print 'Suggestions:', b.url
        suggestions =  self.db.get_suggestions(b._id)
        for s in suggestions:
            print s.suggestion, s.score
        print '\n'

    print pokemon
    print click_store


  
  

manage.action_initdb()
unittest.main()

