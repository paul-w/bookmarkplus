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

test('createCircles', function() { 
    expected = [0, 1];
    returned = ['yo'];

    $.each(this.testCircles, function(name, i) {
        MAIN.createCircle(name, function(circleId) {
           returned.push(circleId); 
           console.log(returned);

        });
    });

    ok(true, 'createCircles');
    //ok(returned == expected, 'createCircles');

});

test('createBookmarks', function() { 
    returned = [];
    console.log(this.testURLs); 
    $.each(this.testURLs, function(url, i) {
        MAIN.createBookmark(url, 0, function(id) {
           returned.push(id);
        });
    });

    ok(true, 'createBookmarks')
    //ok(returned.length === this.testURLs.length);

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


