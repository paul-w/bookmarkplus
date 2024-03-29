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

MAIN = {}

$(document).ready(function() {

  /* Constants */

  var NUM_SUGGESTIONS = 1;
  var ENTER_KEY_CODE = 13;
  var DRAG_REVERT_DURATION = 100;
  var ASC_TEXT = ['<', '>']

  /* Variables */

  var selectedCircle = '';
  var sortBookmarksDivs = []
  var sortBookmarksBy = "{{ bookmark_sort_key }}";
  // 1 indicaets ascending, -1 descending
  var bAscending = "{{ bookmark_sort_order }}";

  /*
    Ajax calls
    Each of these methods should make the appropriate change on the page
  */

  // create a new bookmark, and add it to the given circle, if any
  // call onSuccess with bookmarkID if successful
  MAIN.createBookmark = function (bookmarkURI, circleID, onSuccess) {
    $.post("{{ url_for('create_bookmark') }}", {
      'uri':bookmarkURI
    }, function (response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Bookmark successfully created.');
        $('#add_bookmark_uri').val('');
        if (circleID !== '') {
          MAIN.addBookmarkToCircle(response.bookmark_id, circleID, function (bookmarkID, circleID) {});
        } else {
          drawBookmarksFromServer(selectedCircle);
        }
        drawSuggestionsFromServer();
        onSuccess(response.bookmark_id);
      }
    });
  }

  // delete a bookmark
  MAIN.deleteBookmark = function (bookmarkID) {
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

  // create a new circle and on success, call onSuccess with
  // the id of the new circle as argument
  MAIN.createCircle = function (circleName, onSuccess) {
    $.post("{{ url_for('create_circle') }}", {
      'name':circleName
    }, function(response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Circle successfully created.');
        $('#add_circle_name').val('');
        drawCirclesFromServer();
        onSuccess(response.circle_id);
      }
    });
  }

  // delete a circle
  MAIN.deleteCircle = function (circleID) {
    $.post("{{ url_for('delete_circle') }}", {
      'circle_id': circleID
    }, function (response) {
      if (response.type === 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Circle successfully deleted.');
        if (selectedCircle === circleID) {
          selectedCircle = '';
          drawBookmarksFromServer(selectedCircle);
        }
        drawCirclesFromServer();
      }
    });
  }

  // edit the name of a circle and call onSucces if name change succeeds
  MAIN.editCircle = function (name, newName, onSuccess) {
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

  // add a bookmark to a circle and call onSuccess with the
  // bookmarkID and circleID as parameters
  MAIN.addBookmarkToCircle = function (bookmarkID, circleID, onSuccess) {
    $.post("{{ url_for('add_bookmark_to_circle') }}", {
      'bookmark_id':bookmarkID,
      'circle_id':circleID
    }, function (response) {
      if (response.type == 'error') {
        UTILS.showMessage(response.message);
      } else if (response.type == 'success') {
        UTILS.showMessage('Bookmark successfully added to circle.');
        drawBookmarksFromServer(selectedCircle);
        onSuccess(bookmarkID, circleID);
      }
    });
  }

  // remove a bookmark from a circle
  MAIN.removeBookmarkFromCircle = function (bookmarkID, circleID) {
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

  // if the bookmark is in the circle, call inCircle, otherwise call notInCircle
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
  // call applyToBookmark on each
  MAIN.getBookmarks = function (circleID, applyToBookmark) {
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

  // get all the circles and call applyToCircle on each
  MAIN.getCircles = function (applyToCircle) {
    $.post("{{ url_for('get_circles') }}", {
    }, function (response) {
      $.each(response.circles, function (index, circle) {
        applyToCircle(circle);
      });
    });
  }

  // get all the suggestions and call applyToSuggestion on each
  MAIN.getSuggestions = function (applyToSuggestion) {
    $.post("{{ url_for('get_suggestions') }}", {
      'num_sugg':NUM_SUGGESTIONS,
    }, function (response) {
      $.each(response.suggestions, function(index, suggestion) {
        applyToSuggestion(suggestion);
      });
    });
  }

  // a bookmark was just clicked, recored data
  MAIN.recordClick = function (bookmarkID) {
    $.post("{{ url_for('click') }}", {
      'bookmark_id':bookmarkID
    });
  }

  // gets the title of the given page and call onSuccess with the title
  MAIN.getTitleForURL = function (url, onSuccess) {
    $.post("{{ url_for('title_for_url') }}", {
      'url':url
    }, function (response) {
      onSuccess(response.title);
    });
  }

  /* Bind page elements to Ajax calls */

  // bind add bookmark input box
  $('#add_bookmark_uri').keydown(function(event) {
    if (event.keyCode == ENTER_KEY_CODE) {
      var bookmarkURI = $('#add_bookmark_uri').val();
      if (bookmarkURI == '') {
        UTILS.showMessage('Please provide a bookmark URI.');
      } else {
        MAIN.createBookmark(bookmarkURI, selectedCircle, function (bookmarkID) {});
      }
    }
  });

  // bind add circle input box
  $('#add_circle_name').keydown(function(event) {
    if (event.keyCode == ENTER_KEY_CODE) {
      var circleName = $('#add_circle_name').val();
      if (circleName == '') {
        UTILS.showMessage('Please provide a circle name.');
      } else {
        MAIN.createCircle(circleName, function (circleID) {});
      }
    }
  });

  // make bookmark draggable so that it can be added to circle or deleted
  var makeBookmarkDraggable = function (bookmark) {
    bookmark.draggable({
      start: function (event, ui) {
        ui.helper.addClass("cursor");
        bookmark.addClass("faded");
        $("#add_bookmark").hide();
        $("#delete_bookmark").show();
        $("#add_circle").hide();
        $("#create_circle").show();
        var bookmarkID = bookmark.attr('bookmark_id');
        MAIN.getCircles(function (circle) {
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
        ui.helper.removeClass("cursor");
        bookmark.removeClass("faded");
        $("#add_bookmark").show();
        $("#delete_bookmark").hide();
        $("#add_circle").show();
        $("#create_circle").hide();
        MAIN.getCircles(function (circle) {
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

  // make suggestion draggable so that it can be added as a bookmark
  var makeSuggestionDraggable = function (suggestion) {
    suggestion.draggable({
      start: function (event, ui) {
        ui.helper.addClass("cursor");
        suggestion.addClass('faded');
        $("#add_bookmark").hide();
        $("#create_bookmark").show();
        $("#add_circle").hide();
        $("#create_circle").show();
      },
      stop: function (event, ui) {
        ui.helper.removeClass("cursor");
        suggestion.removeClass('faded');
        $("#add_bookmark").show();
        $("#create_bookmark").hide();
        $("#add_circle").show();
        $("#create_circle").hide();
      },
      revert: 'invalid',
      revertDuration: DRAG_REVERT_DURATION,
      helper: 'clone',
    });
  }

  // make circle draggable so that it can be deleted
  var makeCircleDraggable = function (circle) {
    circle.draggable({
      start: function (event, ui) {
        ui.helper.addClass("cursor");
        circle.addClass("faded");
        $("#add_circle").hide();
        $("#delete_circle").show();
      },
      stop: function (event, ui) {
        ui.helper.removeClass("cursor");
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

  // makes a circle a droppable element so that:
  //  - if a suggestion is dropped, add that suggestion to the circle
  //  - if a bookmark is dropped
  //    - add it if it is not in the circle
  //    - remove it if it is in the circle
  var makeCircleDroppable = function (circle) {
    var circleID = circle.attr('circle_id');
    circle.droppable({
      drop: function (event, ui) {
        if (ui.draggable.hasClass('suggestion')) {
          // suggestion
          MAIN.createBookmark(ui.draggable.attr('uri'), circleID,
              function (bookmarkID) {});
          ui.draggable.remove();
        } else {
          // bookmark
          var bookmarkID = ui.draggable.attr('bookmark_id');
          bookmarkInCircle(bookmarkID, circleID,
            function () {
              MAIN.removeBookmarkFromCircle(bookmarkID, circleID);
            },
            function () {
              MAIN.addBookmarkToCircle(bookmarkID, circleID,
                  function (bookmarkID, circleID) {});
            });
        }
        circle.removeClass('add_bookmark');
        circle.removeClass('remove_bookmark');
      },
      over: function (event, ui) {
        if (ui.draggable.hasClass('suggestion')) {
          // suggestion
          circle.addClass('add_bookmark');
        } else {
          // bookmark
          var bookmarkID = ui.draggable.attr('bookmark_id');
          bookmarkInCircle(bookmarkID, circleID,
            function () {
              circle.addClass('remove_bookmark');
            }, function () {
              circle.addClass('add_bookmark');
            });
        }
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
      var bookmarkID = ui.draggable.attr('bookmark_id');
      MAIN.deleteBookmark(bookmarkID);
    },
    over: function (event, ui) {
      ui.helper.addClass("faded");
    },
    out: function (event, ui) {
      ui.helper.removeClass("faded");
    },
    accept: '.bookmark',
    tolerance: 'intersect'
  });

  // if a circle is dropped in the delete_circle div, delete it
  $('#delete_circle').droppable({
    drop: function (event, ui) {
      var circleID = ui.draggable.attr('circle_id');
      MAIN.deleteCircle(circleID);
    },
    over: function (event, ui) {
      ui.helper.addClass("faded");
    },
    out: function (event, ui) {
      ui.helper.removeClass("faded");
    },
    accpet: '.circle',
    tolerance: 'intersect'
  });

  // if a suggestion or bookmark is dragged to the add_circle div, create
  // a new circle containig it
  $('#create_circle').droppable({
    drop: function (event, ui) {
      var date = new Date();
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      // temporary circle name
      var circleName = year + '/' + month + '/' + day;
      if (ui.draggable.hasClass('suggestion')) {
        // suggestion
        MAIN.createCircle(circleName, function (circleID) {
          MAIN.createBookmark(ui.draggable.attr('uri'), circleID,
              function (bookmarkID) {
            $('div[circle_id="' + circleID + '"]').find('input').val('');
            $('div[circle_id="' + circleID + '"]').find('input').select();
          });
        });
      } else {
        // bookmark
        var bookmarkID = ui.draggable.attr('bookmark_id');
        MAIN.createCircle(circleName, function (circleID) {
          MAIN.addBookmarkToCircle(bookmarkID, circleID,
              function (bookmarkID, circleID) {
            $('div[circle_id="' + circleID + '"]').find('input').val('');
            $('div[circle_id="' + circleID + '"]').find('input').select();
          });
        });
      }
      $('#create_circle').removeClass('add_bookmark');
      $('#create_circle').addClass('create');
    },
    over: function (event, ui) {
      $('#create_circle').addClass('add_bookmark');
      $('#create_circle').removeClass('create');
    },
    out: function (event, ui) {
      $('#create_circle').removeClass('add_bookmark');
      $('#create_circle').addClass('create');
    },
    tolerance: 'intersect',
    accept: '.bookmark'
  });

  // if a suggestion is dropped on the create bookmark div, make it a bookmark
  $('#create_bookmark').droppable({
    drop: function (event, ui) {
      MAIN.createBookmark(ui.draggable.attr('uri'), selectedCircle,
          function (bookmarkID) {});
      ui.draggable.remove();
    },
    over: function (event, ui) {
      $('#create_bookmark').addClass('add_bookmark');
      $('#create_bookmark').removeClass('create');
    },
    out: function (event, ui) {
      $('#create_bookmark').removeClass('add_bookmark');
      $('#create_bookmark').addClass('create');
    },
    tolerance: 'intersect',
    accept: '.suggestion'
  });

  // binds listeners to circle so that:
  //   - if clicked, it filters in to/out of to the bookmarks it contains
  //   - it is draggable
  //   - it is droppabl
  var bindCircleEventListeners = function (circle) {
    var circle_id = circle.attr('circle_id');
    circle.hover(function() {
      circle.addClass('circle_hover');
    }, function() {
      circle.removeClass('circle_hover');
    });
    circle.click(function() {
      if (selectedCircle != circle_id) {
        selectedCircle = circle_id;
        $('.circle').each(function (index, circle_) {
          $(circle_).removeClass('selected');
        });
        circle.addClass('selected');
      } else {
        selectedCircle = '';
        circle.removeClass('selected');
      }
      drawBookmarksFromServer(selectedCircle);
    });
    makeCircleDroppable(circle);
    makeCircleDraggable(circle);
  }

  // clears the circle container, leaving only the circle adder / deleter
  var clearCircleContainer = function () {
    $.each($('#inner_circles_container').children(),
        function (index, circle) {
      if ($(circle).attr('id') !== 'add_circle' &&
          $(circle).attr('id') !== 'delete_circle' &&
          $(circle).attr('id') !== 'create_circle') {
        $(circle).remove();
      }
    });
  }

  // clears the bookmark container, leaving only the bookmark adder / deleter
  var clearBookmarkContainer = function () {
    $.each($('#bookmarks_container').children(), function (index, bookmark) {
      if ($(bookmark).attr('id') !== 'add_bookmark' &&
          $(bookmark).attr('id') !== 'delete_bookmark' &&
          $(bookmark).attr('id') !== 'create_bookmark') {
        $(bookmark).remove();
      }
    });
  }

  // returns a URI containing the favicon for URI
  // URI should contain '://'
  var faviconFor = function (URI) {
    var schemeSeparator = URI.indexOf('://');
    var hierPart = URI.substring(schemeSeparator + '://'.length);
    return 'http://www.getfavicon.org/?url=' + hierPart;
  }

  // makes and returns a div that contains the given uri, or the
  // respective title. This helper method is used in
  // |drawBookmark| and |drawSuggestion|
  var drawUrlContainer = function (URI) {
    var container = $('<div/>');
    container.attr('uri', URI);
    container.addClass('bookmark');
    var favicon = $('<img/>');
    favicon.attr('src', faviconFor(URI));
    favicon.addClass('favicon');
    var faviconContainer = $('<div/>');
    faviconContainer.append(favicon);
    faviconContainer.addClass('favicon_container');
    container.append(faviconContainer);
    var uriLink = $('<a/>');
    uriLink.addClass('bookmark_text');
    uriLink.text(URI);
    MAIN.getTitleForURL(URI, function (title) {
      uriLink.text(title);
    });
    var textContainer = $('<div/>');
    textContainer.append(uriLink);
    textContainer.addClass('bookmark_text_container');
    container.append(textContainer);
    container.hover(function() {
      container.addClass('bookmark_hover');
    }, function() {
      container.removeClass('bookmark_hover');
    });
    return container;
  }

  // draw a bookmark div and bind the appropriate listeners
  var drawBookmark = function (bookmarkID, bookmarkURI) {
    bookmarkContainer = drawUrlContainer(bookmarkURI);
    bookmarkContainer.attr('bookmark_id', bookmarkID);
    bookmarkContainer.click(function () {
      window.open(bookmarkURI);
      MAIN.recordClick(bookmarkID);
    });
    makeBookmarkDraggable(bookmarkContainer);
    $('#bookmarks_container').append(bookmarkContainer);
  }

  // draw a suggestion bookmark and bind the appropriate listeners
  var drawSuggestion = function (suggestionURI) {
    suggestionContainer = drawUrlContainer(suggestionURI);
    suggestionContainer.addClass('suggestion');
    suggestionContainer.click(function () {
      window.open(suggestionURI);
    });
    makeSuggestionDraggable(suggestionContainer);
    $('#bookmarks_container').append(suggestionContainer);
  }

  // draw a circle div and bind the appropriate listeners
  var drawCircle = function (circleID, circleName) {
    var div = $('<div/>');
    div.addClass('circle');
    div.attr('circle_id', circleID);
    var input = $('<input type="text"/>');
    input.addClass('circle_name');
    input.attr('maxlength', '{{ max_circle_name_length }}');
    input.val(circleName);
    div.append(input);
    input.keydown(function (event) {
      if (event.keyCode == ENTER_KEY_CODE) {
        var newCircleName = input.val();
        if (newCircleName === '') {
          UTILS.showMessage('Please enter a new circle name.');
        } else if (newCircleName === circleName) {
          UTILS.showMessage('Please enter a different circle name.');
        } else {
          MAIN.editCircle(circleName, newCircleName, function () {
            circleName = newCircleName;
            input.val(newCircleName);
            input.blur();
          });
        }
        input.val(circleName);
      }
      event.stopPropagation();
    });
    input.click(function (event) {
      event.stopPropagation();
    });
    input.blur(function (event) {
      input.val(circleName);
    });
    bindCircleEventListeners(div);
    $('#inner_circles_container').append(div);
  }

  // populates bookmark elements and attaches listeners
  // called
  // 1) when document ready initially
  // 2) after a user interaction that modifies the circles
  var drawCirclesFromServer = function () {
    clearCircleContainer();
    MAIN.getCircles(function (circle) {
      drawCircle(circle.id, circle.name);
    });
    // if a circle is selected, show that it is selected
    if (selectedCircle !== '') {
      var circleDiv = $("div[circle_id='" + selectedCircle + "']");
      circleDiv.addClass('selected');
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
    MAIN.getBookmarks(circleID, function (bookmark) {
      drawBookmark(bookmark.id, bookmark.url);
    });
  };

  // populates suggestion bookmarks
  var drawSuggestionsFromServer = function() {
    MAIN.getSuggestions(function (suggestion) {
      drawSuggestion(suggestion.url);
    });
  };

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
        sortBookmarkDiv.removeClass('selected_sort');
      });
      $(this).addClass('selected_sort');
      if (text ===  sortBookmarksBy) {
        bAscending = -bAscending;
        ascDiv.text(ASC_TEXT[(parseInt(bAscending)+1)/2]);
      }
      else {
        bAscending = 1;
        sortBookmarksBy =  text
        ascDiv.text(ASC_TEXT[(parseInt(bAscending)+1)/2]);
      }
      drawBookmarksFromServer(selectedCircle);
    });
    b_options_div.append(div);
    sortBookmarksDivs.push(div);
  {% endfor %}

  var ascDiv = $('<div/>');
  ascDiv.text(ASC_TEXT[(parseInt(bAscending)+1)/2]);
  ascDiv.addClass('sort');
  ascDiv.addClass('selected_sort');
  b_options_div.append(ascDiv);

  /* Initialization */

  // display bookmarks, circles, and suggestions
  drawBookmarksFromServer(selectedCircle);
  drawCirclesFromServer();

  // clear all inputs
  $('input').val('');

  // create and delete divs should only be visible when
  // object is being dragged
  $('#create_bookmark').hide();
  $('#delete_bookmark').hide();
  $('#create_circle').hide();
  $('#delete_circle').hide();

  // show all flash messages
  {% for message in get_flashed_messages() %}
    UTILS.showMessage("{{ message }}");
  {% endfor %}

});
