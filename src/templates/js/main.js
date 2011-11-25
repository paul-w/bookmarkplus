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

    var sortBy = 0;
    var selectedCircle = 0;

    // draw circles and bookmarks initially
    drawCirclesFromServer()
    drawBookmarksFromServer()

});

// contains elements for bookmarks for currently selected circle
var bookmarkElemens = []

// contains all elements for all circles 
var circleElements = []

// populates bookmark elements and attaches listeners
// called
// 1) when document ready initially
// 2) after a user interaction that modifies the circles
var getCirclesFromServer = function(var sortType) {
    // uses global variable selectedCircle
};

// populates circle elements and attaches listeners
// called
// 1) when document ready initially
// 2) when the selected circle changes
// 3) when bookmarks are re-sorted
// 4) after a user interaction that modifies bookmarks
var getBookmarksFromServer = function(var circleID, var sortBy) {
    // uses global variables selectedCircle and sortBy 
};


