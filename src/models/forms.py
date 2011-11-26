#TODO(pauL): import only what's needed 
from flask import *
from flaskext.wtf import *


class CreateBookmarkForm(Form):
    uri = TextField('URL')

class CreateCircleForm(Form):
    name = TextField('Name')

class AddBookmarkToCircleForm(Form):
    uri = TextField('URL')
    name = TextField('Name')

