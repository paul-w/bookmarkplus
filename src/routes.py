"""
Request router for amphoros.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from flask import Flask

app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
  return 'Hello world!'
