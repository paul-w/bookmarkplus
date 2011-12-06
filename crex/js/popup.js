/**
 * JavaScript for the popup page for the Bookmark+ chrome extension.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 **/

$(document).ready(function() {
  // TODO(jven): this domain must be granted permissions in manifest.json
  var DOMAIN = 'http://jasper.xvm.mit.edu/';
  var not_logged_in = function() {
    $('#logged_in').hide();
    $('#not_logged_in').show();
  };
  var logged_in = function(name, email) {
    $('#not_logged_in').hide();
    $('#logged_in').show();
    $('#message').text('You are logged in as ' + name + ' (' + email + ').');
  };
  var check_login = function() {
    $.post(DOMAIN + 'is_logged_in', {}, function(response) {
      if (response.logged_in) {
        logged_in(response.name, response.email);
      } else {
        not_logged_in();
      }
    });
  };
  var initialize = function() {
    $('#not_logged_in').hide();
    $('#logged_in').hide();
    $('.textbox').each(function(idx, elt_id) {
      var elt = $(elt_id);
      var container = $('<div/>');
      container.addClass('container');
      var placeholder = $('<div/>');
      placeholder.addClass('placeholder');
      placeholder.text(elt.attr('default'));
      elt.appendTo(container);
      placeholder.appendTo(container);
      container.appendTo('#form');
      // cool stuff
      elt.focus(function() {
        placeholder.fadeOut(100);
      });
      elt.blur(function() {
        if (elt.val() == '') {
          placeholder.show();
        }
      });
      placeholder.click(function() {
        elt.focus();
      });
      // enter key
      elt.keydown(function(event) {
        if (event.keyCode == 13) {
          $('#login').click();
        }
      });
    });
    $('#login').appendTo('#form');
    $('#login').click(function() {
        $.post(DOMAIN + 'login', {
          'email':$('#email').val(),
          'password':$('#password').val()
        }, function(response) {
          if (response.type == "error") {
            $('#errors').hide();
            $('#errors').text(response.error);
            $('#errors').fadeIn();
          } else if (response.type == "redirect") {
            check_login();
          }
        });
    });
    $('#logout').click(function() {
      $.get(DOMAIN + 'logout', {}, function(response) {
        check_login();
      });
    });
    check_login();
  };
  // initialize
  initialize();
});
