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
    }, function(response_crex) {
      $.post('http://jasper.xvm.mit.edu/createbookmark', {
          'uri':response_crex.url
      }, function(response_amphoros) {
        if (response_amphoros.type == 'error') {
          alert(response_amphoros.message);
        } else if (response_amphoros.type == 'success') {
          alert('Successfully created bookmark for url \'' +
              response_crex.url + '\'.');
        } else {
          alert('Unexpected response: ' + response_amphoros);
        }
      });
    });
  };
  shortcut.add('Ctrl+B', add_bookmark);
  shortcut.add('Meta+B', add_bookmark);
});
