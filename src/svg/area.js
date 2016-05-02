var line = require('./line'),
    opt = require('../arrays');

module.exports = function area(option){
    "use restrict";
    var option = option || {},
        x = option.x || [],
        y = option.y || [];

    var area = function(){
        var path = line({x: x, y: y});
        var close = [
            "L", opt.max(x), opt.max(y),
            "L", opt.min(x), opt.max(y),
            "Z"
        ];
        return path() + close.join(" ");
    }

    area.x = function(d) {
        x = x.concat(d);
        return area;
    }

    area.y = function(d) {
        y = y.concat(d);
        return area;
    }

    return area;
};
