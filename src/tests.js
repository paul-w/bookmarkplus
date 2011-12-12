test('testRoutes()', function() { 
    test_urls = [
    'google.com',
    'www.google.com',
    'www.yahoo.com',
    ];
    
    $.each(test_urls, function(url, i) {
        $.post("{{ url_for('create_bookmark') }}", {
             'uri':url,
         }, function (response) {
           ok(response.type != 'error');
         });
    });

})   
