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
  var messages = $('div#messages');
  var message = $('<div>');
  message.text(message_text);
  message.addClass('message');
  messages.empty();
  message.click(function () {
    $(this).hide();
  });
  messages.append(message);
  setTimeout(function() {
    message.fadeOut('slow', 'linear');
  }, UTILS.MESSAGE_DURATION);
}

// hides temporary message for textareas if textarea is out of focus and empty
// when |container| is clicked, focuses the input inside it
// |container| should have an input and a span that is meant to be a holder
// for the input
UTILS.toggleInputMessage = function (container) {
  var holder = $(container).find('span');
  var input = $(container).find('input');
  // If a container is clicked, focus input
  $(container).click(function (input_) {
    return function () {
      input_.focus();
    }
  }($(input)));
  // If input is in focus, hide holder
  $(input).focusin(function (holder_) {
    return function () {
      holder_.hide();
    }
  }($(holder)));
  // If input is empty and out of focus, show holder
  $(input).focusout(function (input_, holder_) {
    return function () {
      if (input_.val() === '') {
        holder_.show();
      }
    }
  }($(input), $(holder)));
}
