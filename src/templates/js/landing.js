/**
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * JavaScript for landing page.
 */

$(document).ready(function() {
  // When login form is submitted, make an ajax call to '/login'.
  // On success, redirect to main page.
  // On failure, report the error.
  var login_form = $("form#login_form");
  login_form.submit(function () {
    var email = $("input#login_email").val();
    var password = $("input#login_password").val();
    $.post("login", {
             "email": email,
             "password": password
           },
           function (response) {
             if (response.type === "error") {
               $("span#login_error").text(response.error);
             } else if (response.type === "redirect") {
               window.location.replace(response.url);
             } else {
               // We should never get here
             }
           });
    return false;
  });

  // When register form is submitted, make an ajax call to '/register'.
  // On success, redirect to main page.
  // On failure, report the error.
  var register_form = $("form#register_form");
  register_form.submit(function () {
    var name = $("input#register_name").val();
    var email = $("input#register_email").val();
    var password = $("input#register_password").val();
    var repassword = $("input#register_repassword").val();
    $.post("register", {
             "name": name,
             "email": email,
             "password": password,
             "repassword": repassword
           },
           function (response) {
             if (response.type === "error") {
               $("span#register_error").text(response.error);
             } else if (response.type === "redirect") {
               window.location.replace(response.url);
             } else {
               // We should never get here
             }
           });
    return false;
  });

  // For each place_holder-text_input pair, attach listeners so that
  //   a palce_holder is visible only when the correspodning text_input
  //   is not in focus and is empty
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

  // Hide the about div and bind the links.
  $('#about').hide();
  $('#about_link').click(function() {
    $('#register_login').slideUp();
    $('#about').slideDown();
  });
  $('#back_link').click(function() {
    $('#about').slideUp();
    $('#register_login').slideDown();
  });

});
