/**
 * JavaScript for background page of Bookmark+ chrome extension.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 **/

$(document).ready(function() {
  shortcut.add('Ctrl+B', function() {
    alert('added bookmark (ctrl)');
  });
  shortcut.add('Meta+B', function() {
    alert('added bookmark (meta)');
  });
});
