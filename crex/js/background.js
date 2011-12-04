/**
 * JavaScript for background page of Bookmark+ chrome extension.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 **/

chrome.extension.onRequest.addListener(function(request, sender, callback) {
  if (request.type == 'get_bookmark_url') {
    chrome.windows.getCurrent(function(window) {
      chrome.tabs.getSelected(window.id, function(tab) {
        callback({'url':tab.url});
      });
    });
  } else {
    callback({});
  }
});
