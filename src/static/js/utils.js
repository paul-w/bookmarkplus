
// automatically generates getters
// based on PEZ's post: http://stackoverflow.com/questions/377716/javascript-automatic-getter-setters-john-resig-book
function bindGetters(o, property, value) {
    var _value = value;
    o["get" + property.charAt(0).toUpperCase() + property.slice(1)] = function() {
        return _value;
    };
}


