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

    var selectedCircle = 0;
    var sortBy = 0;

    // populates bookmark elements and attaches listeners
    // called
    // 1) when document ready initially
    // 2) after a user interaction that modifies the circles
    var drawCirclesFromServer = function() {
        $.getJSON('/?action=getcircles', function(data) {
            document.write(data);
            $.each(data, function(i, o) {
                var circle = new Circle(o[0]);
                div = $('<div>');
                div.text(circle.getName());
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
        $.getJSON('/?action=getbookmarks&circle='+selectedCircle,
            function(data) {
                $.each(data, function(i, o) {
                    var bookmark = new Bookmark(o[0]);
                    div = $('<div>');
                    div.text(bookmark.getURI());
                    bookmark.click(function() {
                        window.open(bookmarks[i].getURI()); 
                    });
                    $('#bookmarks_container').append(div);
            });
        });
    };

    drawBookmarksFromServer();
    drawCirclesFromServer();



});
