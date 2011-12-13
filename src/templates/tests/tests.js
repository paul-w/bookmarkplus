bookmarkIDs = [];

module("testMethods", {
      setup: function() {
          
         // last two are duplicates 
         this.testURLs = [
            'https://www.google.com/search?gcx=c&sourceid=chrome&ie=UTF-8&q=divided+highway',
            'dividedhighwayrocks.com/',
            'en.wikipedia.org/wiki/Dual_carriageway',
            'http://www.thefreedictionary.com/divided+highway',
            'www.thefreedictionary.com/divided+highway'
                        ];
         numURLs = this.testURLs.length -1;
         ok(true, "setup successful");
            }
});

test('createBookmarks', function() { 

    // createBookmark
    count = 0;
    $.each(this.testURLs, function(i, url) {
        MAIN.createBookmark(url, '', function(id) {
           bookmarkIDs.push(id);
           start();
           count = count + 1;
           if(count===numURLs){
                ok(bookmarkIDs.length==numURLs);
                deleteBookmarkTest(bookmarkIDs);
           }
        });
    });
    stop(numURLs);
});

var deleteBookmarkTest = function(bookmarkIDs) {
    // deleteBookmark
    deletedID = bookmarkIDs[0];
    MAIN.deleteBookmark(deletedID);
    ok(true);

    bookmarkIDs = $.grep(
        bookmarkIDs, function(id) {
          return id != deletedID;
    });
    
    ok(bookmarkIDs.length === numURLs-1) ;
    getBookmarksTest(bookmarkIDs);
};


var getBookmarksTest = function(bookmarkIDs) {
    expectedURLs = [
    'http://dividedhighwayrocks.com/',
    'http://en.wikipedia.org/wiki/Dual_carriageway',
    'http://www.thefreedictionary.com/divided+highway',
    ];
    resultURLs = [

    ];
    resultIDs = [

    ];
    
    // getBookmarks
    count = 0;
    MAIN.getBookmarks(undefined, function(b) {
        resultURLs.push(b.url);
        resultIDs.push(b.id);
        start();
        count = count + 1;
        if(count === expectedURLs.length){
          for(i=0; i<expectedURLs.length; i++){
                ok(resultURLs[i]===expectedURLs[i]);
                ok(resultIDs[i]===bookmarkIDs[i]);
          }
        }
    });
    stop(bookmarkIDs.length-1);
};

var createCircleTest = function(bookmarkIDs) {
    start();
    start();
    testCircles = [
    'circle1',
    'circle2',
    ];
    circleIDs = [];
    count = 0;
    $.each(testCircles, function(i, name) {
        //stop();
        MAIN.createCircle(name, function(circleId) {
           //start();
           circleIDs.push(circleId); 
           count = count + 1;
           if(count===testCircles.length){
              ok(circleIDs.length===testCircles.length); 
           };
        });
    });
};

test('deleteCircles', function() { 
    MAIN.deleteCircle(circleIDs[0]);
    ok(true);
});

test('editCircles', function() { 
    MAIN.editCircle('circle1', 'sparkly');
    ok(true);
});

test('addBookmarkToCircle', function() { 
    MAIN.addBookmarkToCircle(bookmarkIDs[0], circleIDs[0]);
    ok(true);
});

test('removeBookmarkFromCircle', function() { 
    MAIN.removeBookmarkFromCircle(bookmarkIDs[0], circleIDs[0]);
    ok(true);
});

test('getBookmarks', function() { 
        ok(true);
});

test('getCircles', function() { 
    MAIN.getCircles(function(c) {
    
    });
    ok(true);
});

test('getSuggestions', function() { 
    MAIN.getCircles(function(s) {
    
    });
    ok(true);
});

test('recordClick', function() { 
    MAIN.recordClick(bookmarkIDs[0]);
    ok(true);
});

test('getTitleForUrl', function() { 
    expected = 'Google News'
    MAIN.getTitleForUrl(
        'http://news.google.com/', function(title) {
            ok(title===expected);
        });
});


/*
MAIN.getBookmarks(0, function(b) {
        console.log('called!');
        returnedBookmarks.push(b.url);
    });



*/


    //ok(yowattup===7);

    /*
        $.post("{{ url_for('create_bookmark') }}", {
             'uri':url,
         }, function (returned) {
           ok(returned.type != 'error');
         });

        */


