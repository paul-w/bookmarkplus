/**
 * JavaScript for landing page.
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 */

$(document).ready(function() {

  // show all flash messages
  {% for message in get_flashed_messages() %}
    UTILS.showMessage('{{ message }}');
  {% endfor %}

  // When login form is submitted, make an ajax call to '/login'.
  // On success, redirect to main page.
  // On failure, report the error.
  var login_form = $('form#login_form');
  login_form.submit(function() {
    var email = $('input#login_email').val();
    var password = $('input#login_password').val();
    $.post('login', {
       'email': email,
       'password': password
     }, function(response) {
       if (response.type === 'error') {
         UTILS.showMessage(response.error);
       } else if (response.type === 'success') {
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
  var register_form = $('form#register_form');
  register_form.submit(function() {
    var name = $('input#register_name').val();
    var email = $('input#register_email').val();
    var password = $('input#register_password').val();
    var repassword = $('input#register_repassword').val();
    $.post('register', {
        'name': name,
        'email': email,
        'password': password,
        'repassword': repassword
    }, function(response) {
      if (response.type === 'error') {
        UTILS.showMessage(response.error);
      } else if (response.type === 'success') {
        window.location.replace(response.url);
      } else {
        // We should never get here
      }
    });
    return false;
  });

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
