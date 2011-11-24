"""
Utility methods.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

from hashlib import sha256

SALT = 'w59eSNVAE9ZpB29QF4A1'

def get_hashed_password(raw_password):
  return unicode(sha256(raw_password + SALT).hexdigest())
