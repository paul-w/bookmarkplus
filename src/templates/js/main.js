/**
 * Authors:
 * Michael Mekonnen (mikemeko@mit.edu)
 * Paul Woods (pwoods@mit.edu)
 * Justin Venezuela (jven@mit.edu)
 * JavaScript for main page.
 */

/*
At any given point, this code only knows about:
1)  All circles
2)  Which circle is selected
3)  Only the bookmarks for the selected circle
4)  How the bookmarks from the selected are being sorted

When the document is first ready:
0 ) get/draw circles + bookmarks initially from
On user interaction:
1)  call function on server to modify circles + bookmarks
2)  if function was modifying, get circles + bookmarks from server and immediately redraw

sorting just re-queries the db with a different sorting parameter
*/

$(document).ready(function() {

  /* Constants */

  var NUM_SUGGESTIONS = 3;
  var ENTER_KEY_CODE = 13;
  var DRAG_REVERT_DURATION = 100;

  /* Variables */

  var selectedCircle = '';
  var sortBookmarksDivs = []
  var sortBookmarksBy = "{{ bookmark_sort_key }}";
  // 1 indicaets ascending, -1 descending
  var bAscending = "{{ bookmark_sort_order }}";

  /* Add missing elements to page */

  // sorting options
  b_options_div = $('#bookmark_sort_options')
  {% for option in bookmark_sort_options %}
    var div = $('<div/>');
    div.text("{{ option }}");
    div.addClass('sort');
    div.click(function() {
      text =  $(this).text();
      $.each(sortBookmarksDivs, function(index, sortBookmarkDiv) {
        sorBookmarkDiv.removeClass('selected_sort');
      });
      $(this).addClass('selected_sort');
      if (text ===  sortBookmarksBy) {
        bAscending = -bAscending;
      }
      else {
        bAscending = 1;
        sortBookmarksBy =  text
      }
      drawBookmarksFromServer(selectedCircle);
    });
    b_options_div.append(div);
    sortBookmarksDivs.push(div);
  {% endfor %}

  /*
    Ajax calls
    Each of these methods should make the respective change on the page
  */

  // create a new bookmark
  var createBookmark = function (bookmarkURI) {
    $.post("{{ url_for('create_bookmark') }}", {
      'uri':bookmarkURI
    }, function (response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Bookmark successfully created.');
        $('#create_bookmark_uri').val('');
        // if we are in a circle, add the new bookmark to the circle
        if (selectedCircle !== '') {
          addBookmarkToCircle(response.bookmark_id, selectedCircle);
        } else {
          drawBookmarksFromServer(selectedCircle);
        }
      }
    });
  }

  // delete a bookmark
  var deleteBookmark = function (bookmarkID) {
    $.post("{{ url_for('delete_bookmark') }}", {
      'bookmark_id': bookmarkID
    }, function (response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage("Bookmark successfully deleted.");
        $('div[bookmark_id=' + bookmarkID + ']').remove();
        drawBookmarksFromServer(selectedCircle);
      }
    });
  }

  // create a new circle
  var createCircle = function (circleName) {
    $.post("{{ url_for('create_circle') }}", {
      'name':circleName
    }, function(response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Circle successfully created.');
        $('#create_circle_name').val('');
        drawCirclesFromServer();
      }
    });
  }

  // delete a circle
  var deleteCircle = function (circleID) {
    $.post("{{ url_for('delete_circle') }}", {
      'circle_id': circleID
    }, function (response) {
      if (response.type === 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Circle successfully deleted.');
        if (selectedCircle === circleID) {
          selectedCircle = '';
        }
        drawCirclesFromServer();
      }
    });
  }

  // edit the name of a circle and call onSucces if name change succeeds
  var editCircle = function (name, newName, onSuccess) {
    $.post("{{ url_for('edit_circle') }}", {
      'name':name,
      'new_name':newName
    }, function (response) {
      if (response.type === 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type === 'success') {
        UTILS.showMessage('Circle name successfully changed.');
        onSuccess();
      }
    });
  }

  // add a bookmark to a circle
  var addBookmarkToCircle = function (bookmarkID, circleID) {
    $.post("{{ url_for('add_bookmark_to_circle') }}", {
      'bookmark_id':bookmarkID,
      'circle_id':circleID
    }, function (response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Bookmark successfully added to circle.');
        drawBookmarksFromServer(selectedCircle);
      }
    });
  }

  // remove a bookmark from a circle
  var removeBookmarkFromCircle = function (bookmarkID, circleID) {
    $.post("{{ url_for('remove_bookmark_from_circle') }}", {
        'bookmark_id':bookmarkID,
        'circle_id':circleID
    }, function (response) {
        if (response.type == 'error') {
          UTILS.showMessage(response.message);
        } else if (response.type == 'success') {
          UTILS.showMessage('Bookmark successfully removed from circle.');
          drawBookmarksFromServer(selectedCircle);
        }
    });
  }

  // if the bookmark is in the circle, do |inCircle|, otherwise do |notInCircle|
  var bookmarkInCircle = function (bookmarkID, circleID, inCircle, notInCircle) {
        $.post("{{ url_for('is_bookmark_in_circle') }}", {
          bookmark_id:bookmarkID,
          circle_id:circleID
        }, function (response) {
          if (response.bookmark_in_circle) {
            inCircle();
          } else {
            notInCircle();
          }
        });
  }

  // get all the bookmarks (for the respective circle if given) and
  // call |applyToBookmark| on each
  var getBookmarks = function (circleID, applyToBookmark) {
    $.post("{{ url_for('get_bookmarks') }}", {
      'circle_id':circleID,
      'sort_by':sortBookmarksBy,
      'ascending':bAscending
    }, function (response) {
      $.each(response.bookmarks, function (index, bookmark) {
        applyToBookmark(bookmark);
      });
    });
  }

  // get all the circles and call |applyToCircle| on each
  var getCircles = function (applyToCircle) {
    $.post("{{ url_for('get_circles') }}", {
    }, function (response) {
      $.each(response.circles, function (index, circle) {
        applyToCircle(circle);
      });
    });
  }

  // get all the suggestions and call |applyToSuggestion| on each
  var getSuggestions = function (applyToSuggestion) {
    $.post("{{ url_for('get_suggestions') }}", {
      'num_sugg':NUM_SUGGESTIONS,
    }, function (response) {
      $.each(response.suggestions, function(index, suggestion) {
        applyToSuggestion(suggestion);
      });
    });
  }

  // a bookmark was just clicked, recored data
  var recordClick = function (bookmarkID) {
    $.post("{{ url_for('click') }}", {
      'bookmark_id':bookmarkID
    });
  }

  /* Bind page elements to Ajax calls */

  // bind sort option toggler
  // TODO(mikemeko, pauL): do we still need this?


  // bind create bookmark input box
  $('#create_bookmark_uri').keydown(function(event) {
    if (event.keyCode == ENTER_KEY_CODE) {
      var bookmarkURI = $('#create_bookmark_uri').val();
      if (bookmarkURI == '') {
        UTILS.showMessage('Please provide a bookmark URI.');
      } else {
        createBookmark(bookmarkURI);
      }
    }
  });

  // bind create circle input box
  $('#create_circle_name').keydown(function(event) {
    if (event.keyCode == ENTER_KEY_CODE) {
      var circleName = $('#create_circle_name').val();
      if (circleName == '') {
        UTILS.showMessage('Please provide a circle name.');
      } else {
        createCircle(circleName);
      }
    }
  });

  // make |bookmark| draggable so that it can be added to circle or deleted
  var makeBookmarkDraggable = function (bookmark) {
    bookmark.draggable({
      start: function (event, ui) {
        bookmark.addClass("faded");
        $("#add_bookmark").hide();
        $("#delete_bookmark").show();
        var bookmarkID = bookmark.attr('bookmark_id');
        getCircles(function (circle) {
          var circleDiv = $('div[circle_id=' + circle.id + ']');
          bookmarkInCircle(bookmarkID, circle.id,
            function () {
              circleDiv.addClass('closed');
            }, function () {
              circleDiv.addClass('open');
            });
        });
      },
      stop: function (event, ui) {
        bookmark.removeClass("faded");
        $("#add_bookmark").show();
        $("#delete_bookmark").hide();
        getCircles(function (circle) {
          var circleDiv = $('div[circle_id=' + circle.id + ']');
          circleDiv.removeClass('open');
          circleDiv.removeClass('closed');
        });
      },
      revert: 'invalid',
      revertDuration: DRAG_REVERT_DURATION,
      helper: 'clone',
      containment: 'window',
    });
  }

  // make |circle| draggable so that it can be deleted
  var makeCircleDraggable = function (circle) {
    circle.draggable({
      start: function (event, ui) {
        circle.addClass("faded");
        $("#add_circle").hide();
        $("#delete_circle").show();
      },
      stop: function (event, ui) {
        circle.removeClass("faded");
        $("#add_circle").show();
        $("#delete_circle").hide();
      },
      revert: 'invalid',
      revertDuration: DRAG_REVERT_DURATION,
      helper: 'clone',
      containment: 'parent'
    });
  }

  // makes a circle a droppable element so that if a bookmark is dropped
  // into it, that bookmark is added to it
  var makeCircleDroppable = function (circle) {
    var circleID = circle.attr('circle_id');
    circle.droppable({
      drop: function (event, ui) {
        var bookmarkID = ui.draggable.attr('bookmark_id');
        bookmarkInCircle(bookmarkID, circleID,
          function () {
            removeBookmarkFromCircle(bookmarkID, circleID);
          },
          function () {
            addBookmarkToCircle(bookmarkID, circleID);
          });
        circle.removeClass('add_bookmark');
        circle.removeClass('remove_bookmark');
      },
      over: function (event, ui) {
        var bookmarkID = ui.draggable.attr('bookmark_id');
        bookmarkInCircle(bookmarkID, circleID,
          function () {
            circle.addClass('remove_bookmark');
          }, function () {
            circle.addClass('add_bookmark');
          });
      },
      out: function (event, ui) {
        circle.removeClass('add_bookmark');
        circle.removeClass('remove_bookmark');
      },
      accept: '.bookmark',
      tolerance: 'intersect'
    });
  }

  // if a bookmark is dropped in the delete_bookmark div, delete it
  $('#delete_bookmark').droppable({
    drop: function (event, ui) {
      if (ui.draggable.hasClass('bookmark')) {
        var bookmarkID = ui.draggable.attr('bookmark_id');
        deleteBookmark(bookmarkID);
      } else {
        UTILS.showMessage("That is not a bookmark.");
      }
    },
    over: function (event, ui) {
      ui.helper.addClass("faded");
    },
    out: function (event, ui) {
      ui.helper.removeClass("faded");
    },
    tolerance: 'touch'
  });

  // if a circle is dropped in the delete_circle div, delete it
  $('#delete_circle').droppable({
    drop: function (event, ui) {
      if (ui.draggable.hasClass('circle')) {
        var circleID = ui.draggable.attr('circle_id');
        deleteCircle(circleID);
      } else {
        UTILS.showMessage("That is not a circle.");
      }
    },
    over: function (event, ui) {
      ui.draggable.addClass("faded");
    },
    out: function (event, ui) {
      ui.draggable.removeClass("faded");
    },
    tolerance: 'touch'
  });

  // binds listeners to |circle| to make it behave like a circle
  var bindCircleEventListeners = function (circle) {
    var circle_name = circle.find('span');
    var circle_id = circle.attr('circle_id');
    circle.click(function() {
      if (selectedCircle != circle_id) {
        selectedCircle = circle_id;
        $('.circle').each(function (index, circle_) {
          $(circle_).find('span').removeClass('selected');
        });
        circle_name.addClass('selected');
      } else {
        selectedCircle = '';
        circle_name.removeClass('selected');
      }
      drawBookmarksFromServer(selectedCircle);
    });
    makeCircleDroppable(circle);
    makeCircleDraggable(circle);
  }

  // clears the circle container, leaving only the circle adder / deleter
  var clearCircleContainer = function () {
    $.each($('#inner_circles_container').children(), function (index, circle) {
      if ($(circle).attr('id') !== 'add_circle' &&
          $(circle).attr('id') !== 'delete_circle') {
        $(circle).remove();
      }
    });
  }

  // clears the bookmark container, leaving only the bookmark adder / deleter
  var clearBookmarkContainer = function () {
    $.each($('#bookmarks_container').children(), function (index, bookmark) {
      if ($(bookmark).attr('id') !== 'add_bookmark' &&
          $(bookmark).attr('id') !== 'delete_bookmark') {
        $(bookmark).remove();
      }
    });
  }

  // clears the suggestions container
  var clearSuggestionContainer = function () {
    $.each($('#suggestions_container').children(), function (index, suggestion) {
      $(suggestion).remove();
    });
  }

  // draw a bookmark div and bind the appropriate listeners
  var drawBookmark = function (bookmarkID, bookmarkURL) {
    var div = $('<div/>');
    div.addClass('bookmark');
    div.attr('bookmark_id', bookmarkID);
    var favicon = $('<img/>');
    // TODO(mikemeko): this is not robust!
    favicon.attr('src', 'http://www.getfavicon.org/?url='+
                 bookmarkURL.substring(7));
    favicon.addClass('favicon');
    div.append(favicon);
    var a = $('<a/>');
    a.addClass('bookmark_text');
    a.text(bookmarkURL);
    div.append(a);
    div.click(function () {
      window.open(bookmarkURL);
      recordClick(bookmarkID);
    });
    makeBookmarkDraggable(div);
    $('#bookmarks_container').append(div);
  }

  // draw a circle div and bind the appropriate listeners
  var drawCircle = function (circleID, circleName) {
    var div = $('<div/>');
    div.addClass('circle');
    div.attr('circle_id', circleID);
    var span = $('<span/>');
    span.addClass('circle');
    span.text(circleName);
    div.append(span);
    var input = $('<input type="text"/>');
    input.hide();
    div.append(input);
    span.click(function (event) {
      input.show();
      input.focus();
      event.stopPropagation();
    });
    input.keydown(function (event) {
      if (event.keyCode == ENTER_KEY_CODE) {
        var newCircleName = input.val();
        if (newCircleName === '') {
          UTILS.showMessage('Please enter a new circle name.');
        } else if (newCircleName === circleName) {
          UTILS.showMessage('Please enter a different circle name.');
        } else {
          editCircle(circleName, newCircleName, function () {
            span.text(input.val());
            input.hide();
            circleName = newCircleName;
          });
        }
      }
      event.stopPropagation();
    });
    input.focusout(function (event) {
      input.hide();
      event.stopPropagation();
    });
    input.click(function (event) {
      event.stopPropagation();
    });
    bindCircleEventListeners(div);
    $('#inner_circles_container').append(div);
  }

  // draw a suggestion bookmark and bind the appropriate listeners
  // TODO(mikemeko, pauL): there's some repeated code here, but I
  // didn't refactor because I don't know the design choices you have
  // in mind in terms how similar suggestion bookmars are to normal bookmarks
  // We could get in some troble here, like makeBookmarkDraggable won't work
  // TODO(mikemeko, pauL): there are some logs here, remove later
  var drawSuggestion = function (suggestionURL) {
    console.log(suggestion)
    var div = $('<div/>');
    div.addClass('bookmark');
    div.addClass('suggestion');
    var favicon = $('<img/>');
    // TODO(mikemeko): this is not robust!
    favicon.attr('src', 'http://www.getfavicon.org/?url='+
                 suggestionURL.substring(7));
    div.append(favicon);
    favicon.addClass('favicon');
    var a = $('<a/>');
    a.addClass('bookmark_text');
    a.text(suggestionURL);
    div.append(a);
    div.click(function () {
      window.open(suggestionURL);
    });
    console.log(a.text);
    makeBookmarkDraggable(div);
    $('#suggestions_container').append(div);
  }

  // populates bookmark elements and attaches listeners
  // called
  // 1) when document ready initially
  // 2) after a user interaction that modifies the circles
  var drawCirclesFromServer = function () {
    clearCircleContainer();
    getCircles(function (circle) {
      drawCircle(circle.id, circle.name);
    });
    // if a circle is selected, show that it is selected
    if (selectedCircle !== '') {
      var circleDiv = $("div[circle_id='" + selectedCircle + "']");
      circleDiv.find('span').addClass('selected');
    }
  };

  // populates circle elements and attaches listeners
  // called:
  // 1) when document ready initially
  // 2) when the selected circle changes
  // 3) when bookmarks are re-sorted
  // 4) after a user interaction that modifies bookmarks
  var drawBookmarksFromServer = function (circleID) {
    clearBookmarkContainer();
    getBookmarks(circleID, function (bookmark) {
      drawBookmark(bookmark.id, bookmark.url);
    });
  };

  // populates suggestion bookmarks
  var drawSuggestionsFromServer = function() {
    clearSuggestionContainer();
    getSuggestions(function (suggestion) {
      drawSuggestion(suggestion.url);
    });
  };


  /* Initialization */

  // display bookmarks, circles, and suggestions
  drawBookmarksFromServer(selectedCircle);
  drawCirclesFromServer();
  drawSuggestionsFromServer();

  // clear all inputs
  $('input').val('');

  // delete divs should only be visible when the respective delete
  // object is being dragged
  $('#delete_bookmark').hide();
  $('#delete_circle').hide();

  // show all flash messages
  {% for message in get_flashed_messages() %}
    UTILS.showMessage("{{ message }}");
  {% endfor %}

});
