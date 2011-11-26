// yea turns out this wasn't necessary at all
// actually maybe it will helpful when it comes to hte ADTs

var Bookmark = function(uri, title, visits, date_added) {
    var uri = uri;
    var title = title;
    var visit = visits;
    var date_added = date_added;

    this.getTitle = function() {
        return title;
    };
    
    this.getURI = function() {
        return uri;
    };

    var checkRep = function() {

    };
    checkRep();
};

var Circle = function(id, name) {
    var id = id;
    var name = name;
    this.getName = function() {
      return name;
    };
    var checkRep = function() {
    }
    checkRep();
}

