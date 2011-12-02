/**
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * JavaScript for landing page.
 */

UTILS = {}

// life of a pup-up message in milliseconds.
UTILS.MESSAGE_DURATION = 4000;

// shows a pop-up message containing |message_text|.
UTILS.showMessage = function (message_text) {
  var messages = $("div#messages");
  var message = $('<div>');
  message.text(message_text);
  message.addClass('message');
  messages.empty();
  message.click(function () {
    $(this).hide();
  });
  messages.append(message);
  setTimeout(function() {
    message.fadeOut("slow", "linear");
  }, UTILS.MESSAGE_DURATION);
}
