define(function(require){
    var line = require('./line'),
        array = require('p4/core/arrays');
        // opt = require('../arrays');

    return function area(arg){
        "use restrict";
        var option = arg || {},
            x = option.x || [],
            y0 = option.y || option.y0 || [],
            y1 = option.y1 || [];

        var area = function(){
            var close, path;
            if(y1.length) {
                path = line({x: x.concat(x.slice().reverse()), y: y0.concat(y1.slice().reverse())});
                return path() + " Z"
            } else {
                path = line({x: x, y: y0});
                close = function() {
                    return [
                        "L", array.max(x), array.max(y0),
                        "L", array.min(x), array.max(y0),
                        "Z"
                    ].join(" ");
                }
                return path() + close() + " Z";
            }
        }
        return area;
    };

})
