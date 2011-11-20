"""
Management script.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from werkzeug import script

def action_serve():
  """
  Runs amphoros locally at http://localhost:6170/.
  """
  from src.routes import app
  app.run(debug=True, host='0.0.0.0', port=6170)

script.run()
