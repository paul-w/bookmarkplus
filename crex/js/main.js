/**
 * Content script for Bookmark+ chrome extension.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 **/

$(document).ready(function() {
  var add_bookmark = function() {
    chrome.extension.sendRequest({
      'type':'get_bookmark_url'
    }, function(callback_ext) {
      $.post('http://jasper.xvm.mit.edu/createbookmark', {
          'uri':callback_ext.url
      }, function(callback_amphoros) {
        alert('Bookmark added for url \'' + callback_ext.url + '\'.');
      });
    });
  };
  shortcut.add('Ctrl+B', add_bookmark);
  shortcut.add('Meta+B', add_bookmark);
});
