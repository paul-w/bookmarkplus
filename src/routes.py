"""
Request router for amphoros.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from flask import Flask
from flask import render_template
from flask import url_for

# Folder containing html template files
TEMPLATE_FOLDER = 'templates/html'

app = Flask(__name__, template_folder=TEMPLATE_FOLDER)

@app.route('/', methods=['GET'])
def home():
  return render_template('landing.html')
