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
    // clear inputs
    $('input').val('');

    // set variables
    var selectedCircle = '';

    sortBookmarksDivs = []

    b_options_div = $('#bookmark_sort_options')
    {% for option in bookmark_sort_options %}
        div = $('<div/>');
        div.text("{{ option }}");
        div.addClass('sort');
        div.click(function() {
             text =  $(this).text();
             $.each(sortBookmarksDivs, function(i, e) {
                e.removeClass('selected_sort');
                });
             $(this).addClass('selected_sort');
             if(text ===  sortBookmarksBy){
                 bAscending = -bAscending;
             }
             else{ 
                 bAscending = 1;
                 sortBookmarksBy =  text
             }
             drawBookmarksFromServer(selectedCircle);
        });
        b_options_div.append(div);
        sortBookmarksDivs.push(div);
    {% endfor %}

    var sortBookmarksBy = "{{ bookmark_sort_key }}";
    // 1 indicaets ascending, -1 descending
    var bAscending = "{{ bookmark_sort_order }}"; 

    // show all flash messages
    {% for message in get_flashed_messages() %}
      UTILS.showMessage("{{ message }}");
    {% endfor %}

    // bind sort option toggler
     

    // bind create bookmark input box
    $('#create_bookmark_uri').keydown(function(event) {
      if (event.keyCode == 13) {
        if ($('#create_bookmark_uri').val() == '') {
          UTILS.showMessage('You must provide a bookmark URL.');
        } else {
          $.post("{{ url_for('create_bookmark') }}", {
              'uri':$('#create_bookmark_uri').val()
          }, function(response) {
              if (response.type == 'error') {
                UTILS.showMessage(response.message);
              } else if (response.type == 'success') {
                drawBookmarksFromServer(selectedCircle);
                $('#create_bookmark_uri').val('');
                if (selectedCircle != '') {
                  // add bookmark to selected circle
                  $.post("{{ url_for('add_bookmark_to_circle') }}", {
                      'bookmark_id':response.bookmark_id,
                      'circle_id':selectedCircle
                  }, function(response) {
                      if (response.type == 'error') {
                        UTILS.showMessage(response.message);
                      } else if (response.type == 'success') {
                        refreshElements();
                      }
                  });
                }
              }
          });
        }
      }
    });

    // bind create circle input box
    $('#create_circle_name').keydown(function(event) {
      if (event.keyCode == 13) {
        if ($('#create_circle_name').val() == '') {
          UTILS.showMessage('You must provide a circle name.');
        } else {
          $.post("{{ url_for('create_circle') }}", {
              'name':$('#create_circle_name').val()
          }, function(response) {
              if (response.type == 'error') {
                UTILS.showMessage(response.message);
              } else if (response.type == 'success') {
                refreshElements();
                $('#create_circle_name').val('');
              }
          });
        }
      }
    });

    // makes an element draggable
    // element is returned to its original place when dropped
    var makeDraggable = function (element) {
      element.draggable({
        start: function (event, ui) {
          $('#delete').show();
        },
        stop: function (event, ui) {
          $('#delete').hide();
        },
        revert: true,
        helper: 'clone',
        containment: 'window'
      });
    }

    // makes a circle a droppable element such that if a bookmark is dropped
    // into it, it adds that bookmark to the circle
    var makeCircleDroppable = function (circle) {
      circle.droppable({
        drop: function (event, ui) {
          var bookmark_id = ui.draggable.attr('bookmark_id');
          if (typeof(bookmark_id) === "undefined") {
            // TODO(mikemeko): better error message
            UTILS.showMessage("You can't add that to a circle");
          } else {
            var circle_id = $(this).attr('circle_id');
            $.post("{{ url_for('add_bookmark_to_circle') }}", {
                'bookmark_id':bookmark_id,
                'circle_id':circle_id
            }, function(response) {
                if (response.type == 'error') {
                  UTILS.showMessage(response.message);
                } else if (response.type == 'success') {
                  refreshElements();
                  // TODO(mikemeko)
                  UTILS.showMessage("Bookmark successfully added to circle");
                }
            });
          }
          $(this).removeClass("highlight");
        },
        over: function (event, ui) {
          $(this).addClass("highlight");
        },
        out: function (event, ui) {
          $(this).removeClass("highlight");
        },
        tolerance: 'intersect'
      });
    }

    // clears the circle container, leaving only the circle creator
    var clearCircleContainer = function () {
      $.each($('#inner_circles_container').children(), function (idx, circle) {
        if ($(circle).attr('id') !== 'add_circle') {
          $(circle).remove();
        }
      });
    }

    // clears the bookmark container, leaving only the bookmark creator
    var clearBookmarkContainer = function () {
      $.each($('#bookmarks_container').children(), function (idx, bookmark) {
        if ($(bookmark).attr('id') !== 'add_bookmark') {
          $(bookmark).remove();
        }
      });
    }

    // populates bookmark elements and attaches listeners
    // called
    // 1) when document ready initially
    // 2) after a user interaction that modifies the circles
    var drawCirclesFromServer = function() {
        clearCircleContainer();
        $.post("{{ url_for('get_circles') }}", function(data) {
            $.each(data.circles, function(idx, circle) {
                var div = $('<div/>');
                div.addClass("circle");
                div.attr('circle_id', circle.id);
                var span1 = $('<span/>');
                span1.attr('class', 'circle');
                span1.text(circle.name);
                span1.appendTo(div);
                div.click(function() {
                  if (selectedCircle != circle.id) {
                    selectedCircle = circle.id;
                    $('.circle').each(function (idx, elt) {
                      $(elt).removeClass('selected');
                    });
                    span1.addClass('selected');
                  } else {
                    selectedCircle = '';
                    span1.removeClass('selected');
                  }
                  drawBookmarksFromServer(selectedCircle);
                });
                makeCircleDroppable(div);
                makeDraggable(div);
                $('#inner_circles_container').append(div);
            });
            // select the selected circle
            if (selectedCircle !== '') {
              var circleDiv = $("div[circle_id='" + selectedCircle + "']");
              circleDiv.find('span').addClass('selected');
            }
        });
    };

    // populates circle elements and attaches listeners
    // called:
    // 1) when document ready initially
    // 2) when the selected circle changes
    // 3) when bookmarks are re-sorted
    // 4) after a user interaction that modifies bookmarks
    var drawBookmarksFromServer = function(circle_id) {
        clearBookmarkContainer();
        $.post("{{ url_for('get_bookmarks') }}", {
                'circle_id':circle_id,
                'sort_by': sortBookmarksBy,
                'ascending': bAscending
            }, function(data) {
                $.each(data.bookmarks, function(idx, bookmark) {
                    var div = $('<div/>');
                    div.addClass('bookmark');
                    div.attr('bookmark_id', bookmark.id);
                    var favicon = $('<img/>');
                    // TODO(mikemeko): this is not robust!
                    favicon.attr('src', 'http://www.getfavicon.org/?url='+
                                 bookmark.url.substring(7));
                    favicon.appendTo(div);
                    var a = $('<a/>');
                    a.addClass('bookmark_text');
                    a.text(bookmark.url);
                    a.appendTo(div);
                    favicon.addClass('favicon');
                    div.click(function () {
                        window.open(bookmark.url);
                        $.post("{{ url_for('click') }}", {
                            'bookmark_id':bookmark.id
                        });
                    });
                    makeDraggable(div);
                    $('#bookmarks_container').append(div);
            });
        });
    };

    // if an element is dragged to the delete area, delete it
    $('#delete').droppable({
      drop: function (event, ui) {
        // TODO(mikemeko): handle circle delete
        var bookmark_id = ui.draggable.attr('bookmark_id');
        if (typeof(bookmark_id) === "undefined") {
          // TODO(mikemeko): better error message
          UTILS.showMessage("You can't delete that");
        } else {
          $.post("{{ url_for('delete_bookmark') }}", {
            'bookmark_id': bookmark_id
          }, function (response) {
            if (response.type == 'error') {
              UTILS.showMessage(response.message);
            } else if (response.type == 'success') {
              ui.draggable.remove();
              refreshElements();
              // TODO(mikemeko): better error message
              UTILS.showMessage("Bookmark successfully deleted");
            }
          });
        }
      },
      over: function (event, ui) {
        ui.helper.addClass("death");
      },
      out: function (event, ui) {
        ui.helper.removeClass("death");
      },
      tolerance: 'touch'
    });

    // refresh the bookmarks and circles
    var refreshElements = function() {
        drawBookmarksFromServer(selectedCircle);
        drawCirclesFromServer();
    };

    // make initial call to refreshElements
    refreshElements();

    // delete tab should only be visible when something is being dragged
    $('#delete').hide();

});
