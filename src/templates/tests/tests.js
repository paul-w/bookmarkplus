
// tests local mongoDB instance
// clear (manage.py initdb) beforehand

bookmarkIDs = [];

module("testMethods", {
      setup: function() {
          
         // last two are duplicates 
                  ok(true, "setup successful");
            }
});

test('testBookmarks', function() { 
    createBookmarkTest();
});

var createBookmarkTest = function()
{
    testURLs = [
            'https://www.google.com/search?gcx=c&sourceid=chrome&ie=UTF-8&q=divided+highway',
            'dividedhighwayrocks.com/',
            'en.wikipedia.org/wiki/Dual_carriageway',
            'http://www.thefreedictionary.com/divided+highway',
            'www.thefreedictionary.com/divided+highway'
                        ];
     numURLs = testURLs.length -1;

    count = 0;
    $.each(this.testURLs, function(i, url) {
        MAIN.createBookmark(url, '', function(id) {
           bookmarkIDs.push(id);
           start();
           count = count + 1;
           if(count===numURLs){
                ok(bookmarkIDs.length==numURLs);
                deleteBookmarkTest(bookmarkIDs, numURLs);
           }
        });
    });
    stop(numURLs);
};

var deleteBookmarkTest = function(bookmarkIDs, numURLs) {
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

test('testCircles', function() { 
    createCircleTest();
});


var createCircleTest = function() {
    testCircles = [
    'circle1',
    'circle2',
    ];
    circleIDs = [];
    count = 0;
    $.each(testCircles, function(i, name) {
        MAIN.createCircle(name, function(circleId) {
           start();
           circleIDs.push(circleId); 
           count = count + 1;
           if(count===testCircles.length){
              ok(circleIDs.length===testCircles.length); 
              deleteCircleTest(circleIDs);
           };
        });
    });
    stop(testCircles.length-1);
};


var deleteCircleTest = function(circleIDs) {
    MAIN.deleteCircle(circleIDs[0]);
    circleIDs = circleIDs.splice(1,circleIDs.length);
    ok(true);
    editCircleTest(circleIDs);
};

var editCircleTest = function(circleIDs){
    MAIN.editCircle('circle2', 'sparkly', function(){});
    ok(true);
    getCirclesTest(circleIDs);
};

var getCirclesTest = function(circleIDs){
    expectedNames = ['sparkly'];
    resultNames = [];
    resultIDs = [];

    MAIN.getCircles(function(c) {
       start();
       resultNames.push(c.name);
       resultIDs.push(c.id);
       console.log(resultNames);
       console.log(resultIDs);
       console.log(circleIDs);
        for(i=0; i<expectedNames.length; i++){
                ok(resultNames[i]===expectedNames[i]);
                ok(resultIDs[i]===circleIDs[i]);
          }

        
    });

    stop();

}

test('addBookmarkToCircle', function() { 
    MAIN.addBookmarkToCircle(bookmarkIDs[0], circleIDs[0]);
    ok(true);
});

test('removeBookmarkFromCircle', function() { 
    MAIN.removeBookmarkFromCircle(bookmarkIDs[0], circleIDs[0]);
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


