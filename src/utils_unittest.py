"""
Utility method unittest.
"""

__author__ = (
    'Michael Mekonnen (mikemeko@mit.edu),'
    'Justin Venezuela (jven@mit.edu),'
    'Paul Woods (pwoods@mit.edu)'
)

import unittest
from utils import check_name
from utils import check_email
from utils import check_password
from utils import check_circle_name
from utils import url_title

class TestUtilityMethods(unittest.TestCase):
  def test_check_name(self):
    assert check_name('') is not None
    assert check_name('# @') is not None
    assert check_name('Ben Bitdiddle') is None
    assert check_name('Ben 22 Bitdiddle') is None
  def test_check_email(self):
    assert check_email('') is not None
    assert check_email('ben') is not None
    assert check_email('ben@mit') is not None
    assert check_email('ben@mit.e') is not None
    assert check_email('ben@.edu') is not None
    assert check_email('@mit.edu') is not None
    assert check_email('ben%mit.edu') is not None
    assert check_email('ben@mit.edu') is None
    assert check_email('ben%bit_did-dle@mit.edu') is None
  def test_check_password(self):
    assert check_password('password1', 'password2') is not None
    assert check_password('small', 'small') is not None
    assert check_password('long_enough', 'long_enough') is None
  def test_check_circle_name(self):
    assert check_circle_name('elevenchars') is not None
    assert check_circle_name('ninechars') is None
  def test_url_title(self):
    assert url_title('broken_url') == 'broken_url'
    assert url_title('http://www.google.com') == 'Google'

if __name__ == '__main__':
  unittest.main()
