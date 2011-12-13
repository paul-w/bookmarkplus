"""
Utility methods.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from datetime import datetime
from hashlib import sha256
from re import compile
from re import match
from urllib import urlopen

SALT = 'w59eSNVAE9ZpB29QF4A1'
EMAIL_RE = compile(r'\b[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}\b')
NAME_RE = compile(r'\b[a-zA-Z0-9 ]+\b')
MIN_PASSWORD_LENGTH = 6
MAX_CIRCLE_NAME_LENGTH = 10

def get_hashed_password(raw_password):
  return unicode(sha256(raw_password + SALT).hexdigest())

def get_unicode_datetime():
  return unicode(datetime.utcnow().isoformat())

# TODO(mikemeko): unittest this
def check_name(name):
  """
  Checks if |name| is a well formed name for a user:
    - one or more characters from {letters, numbers, space}
  Returns the error, or None if there is no error.
  """
  if NAME_RE.match(name) == None:
    return 'Names must use only letters and numbers.'
  return None

# TODO(mikemeko): unittest this
def check_email(email):
  """
  Checks if |email| is a well formed e-mail:
    - of the form x@y.z
      - x: one or more characters from {letters, numbers, ., _, %, -}
      - y: one or more characters from {letters, numbers, ., -}
      - z: between 2 and 4 characters from {letters}
  Returns the error, or None if there is no error.
  """
  if EMAIL_RE.match(email) == None:
    return 'Invalid e-mail address.'
  return None

# TODO(mikemeko): unittest this
def check_password(password, repassword):
  """
  Checks that |password| and |repassword| are the same.
  Checks that |password| is a well formed password:
    - at least |MIN_PASSWORD_LENGTH| characters
    - TODO(mikemeko): more requrements
  Returns the error, or None if there is no error.
  """
  if password != repassword:
    return 'The two given passwords don\'t match.'
  if len(password) < MIN_PASSWORD_LENGTH:
    return ('Passwords must be at least %d characters long.' %
        MIN_PASSWORD_LENGTH)
  return None

# TODO(mikemeko): unittest this
def check_circle_name(circle_name):
  """
  Checks that |circle_name| has at most |MAX_CIRCLE_NAME_LENGTH| characters
  """
  if len(circle_name) > MAX_CIRCLE_NAME_LENGTH:
    return ('Circle name must be at %d or less characters long.' %
        MAX_CIRCLE_NAME_LENGTH)
  return None

# TODO(mikemeko): unittest this
def url_title(url):
  """
  Returns the title of the web page with the given url
  On failure, returns the url itself
  """
  try:
    f = urlopen(url)
    page = f.read()
    page = page.strip()
    start = page.index('<title>')
    end = page.index('</title>')
    return page[start+7:end]
  except:
    return url
