"""
Management script.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from werkzeug import script

def action_initdb():
  """
  Clears the local database.
  """
  from src.database import Database
  from src.routes import app
  ctx = app.test_request_context()
  ctx.push()
  db = Database(app)
  db._drop_contents()
  print 'NOTICE: Successfully cleared local amphoros database.'

def action_serve():
  """
  Runs amphoros locally at http://localhost:6170/.
  """
  from src.routes import app
  app.run(debug=True, host='0.0.0.0', port=6170)

def action_showdb():
  """
  Show the contents of the local database.
  """
  from src.database import Database
  from src.routes import app
  ctx = app.test_request_context()
  ctx.push()
  db = Database(app)
  db._show_contents()

script.run()
