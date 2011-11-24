/**
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * JavaScript for landing page.
 */

$(document).ready(function() {
  // TODO(jven): take me out of here!
  alert('{{ message }}');

  // For each holder-input pair, attach the appropriate listeners so that
  //   a holder is only visible when the correspodning input is not in focus
  //   and is empty
  text_containers = $("div.text_container");
  for (var i = 0; i < text_containers.length; i++) {
    var container_ = text_containers[i];
    var holder_ = $(container_).find("span");
    var input_ = $(container_).find("input");

    // If a text_container div is clicked, focus the correspoding text input
    $(container_).click(function (input) {
      return function() {
        input.focus();
      };
    }($(input_)));

    // If a text input is in focus, hide holder
    $(input_).focusin(function (holder) {
      return function () {
        holder.hide();
      }
    }($(holder_)));

    // If a text input is empty and out of focus, show holder
    $(input_).focusout(function (input, holder) {
      return function () {
        if (input.val() === "") {
          holder.show();
        }
      }
    }($(input_), $(holder_)));
  }

});
