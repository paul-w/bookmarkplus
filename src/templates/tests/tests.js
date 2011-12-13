module("testMethods", {
      setup: function() {
         this.testURLs = [
            'https://www.google.com/search?gcx=c&sourceid=chrome&ie=UTF-8&q=divided+highway',
            'dividedhighwayrocks.com/',
            'en.wikipedia.org/wiki/Dual_carriageway',
            'http://www.thefreedictionary.com/divided+highway',
            'www.thefreedictionary.com/divided+highway',
                        ];
         this.testCircles = [
            'circle1',
            'circle2',
         ];
         this.expected = this.testURLs.slice(0, 4);
         ok(true, "setup successful");
            }
});

test('createBookmarks', function() { 
    $.each(this.testURLs, function(url, i) {
        MAIN.createBookmark(url, 0, function(id) {
           this.bookmarkIDs.push(id);
        });
    });
    ok(true);
});

test('deleteBookmarks', function() { 
    MAIN.deleteBookmark(bookmarkIDs[0]);
    ok(true);
});

test('createCircles', function() { 
    $.each(this.testCircles, function(name, i) {
        MAIN.createCircle(name, function(circleId) {
           this.circleIDs.push(circleId); 
        });
    });
    ok(true);
});

test('deleteCircles', function() { 
    MAIN.deleteCircle(this.circleIDs[0]);
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
    MAIN.getBookmarks(undefined, function(b) {
    
    });
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


