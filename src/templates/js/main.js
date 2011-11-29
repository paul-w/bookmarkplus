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

    // bind create_bookmark button
    $('#create_bookmark').click(function(event) {
        $.post("{{ url_for('create_bookmark') }}", {
            'uri':$('#create_bookmark_uri').val()
        }, function(response) {
            drawBookmarksFromServer();
        });
    });

    // bind create_circle button
    $('#create_circle').click(function(event) {
        $.post("{{ url_for('create_circle') }}", {
            'name':$('#create_circle_name').val()
        }, function(response) {
            drawCirclesFromServer();
        });
    });

  // bind add_bookmark_to_circle button
    $('#add_bookmark').click(function(event) {
        alert('hi');
        $.post("{{ url_for('add_bookmark_to_circle') }}", {
            'bookmark_id':$('#add_bookmark_id').val(),
            'circle_id':$('#add_circle_id').val()
        }, function(response) {
            drawBookmarksFromServer();
            drawCirclesFromServer();
        });
    });



    var selectedCircle = 0;
    var sortBy = 0;

    // populates bookmark elements and attaches listeners
    // called
    // 1) when document ready initially
    // 2) after a user interaction that modifies the circles
    var drawCirclesFromServer = function() {
        $('#circles_container').html('');
        $.getJSON('/getcircles', function(data) {
            $.each(data.circles, function(idx, circle) {
                var div = $('<div>');
                div.text(circle.name + ' (' + circle.id + ')');
                $('#circles_container').append(div);
            });
        });
    };

    // populates circle elements and attaches listeners
    // called:
    // 1) when document ready initially
    // 2) when the selected circle changes
    // 3) when bookmarks are re-sorted
    // 4) after a user interaction that modifies bookmarks
    var drawBookmarksFromServer = function() {
        $('#bookmarks_container').html('');
        $.getJSON('/getbookmarks',
            function(data) {
                $.each(data.bookmarks, function(idx, bookmark) {
                    var div = $('<div>');
                    div.text(bookmark.url + ' (' + bookmark.id + ')');
                    div.click(function() {
                        window.open(bookmark.url);
                    });
                    $('#bookmarks_container').append(div);
            });
        });
    };

    drawBookmarksFromServer();
    drawCirclesFromServer();



});
