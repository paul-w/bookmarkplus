/**
 * Content script for Bookmark+ chrome extension.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 **/

$(document).ready(function() {
  var show_message = function(message) {
    var popup = $('<div/>');
    $('body').append(popup);
    popup.addClass('amphoros_popup');
    popup.text(message);
    popup.fadeIn(200);
    setTimeout(function() {
      popup.fadeOut(600);
    }, 4000);
  };
  var add_bookmark = function() {
    chrome.extension.sendRequest({
      'type':'get_bookmark_url'
    }, function(response_crex) {
      $.post('http://jasper.xvm.mit.edu/createbookmark', {
          'uri':response_crex.url
      }, function(response_amphoros) {
        if (response_amphoros.type == 'error') {
          show_message(response_amphoros.message);
        } else if (response_amphoros.type == 'success') {
          show_message('Successfully created bookmark for url \'' +
              response_crex.url + '\'.');
        } else {
          show_message('Unexpected response: ' + response_amphoros);
        }
      });
    });
  };
  shortcut.add('Ctrl+B', add_bookmark);
  shortcut.add('Meta+B', add_bookmark);
});
