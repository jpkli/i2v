define(function(require){
    "use restrict";
    return function line(option){
        var option = option || {},
            x = option.x || [],
            y = option.y || [];

        var line = function() {
            if(x.length && y.length) {
                var path = ["M", x[0], y[0]];
                for(var i = 1, l=x.length; i<l; i++){
                    path.push("L");
                    path.push(x[i]);
                    path.push(y[i]);
                }
                return path.join(" ");
            } else {
                throw new Error("x or y undefined.")
            }
        }

        line.x = function(d) {
            x = x.concat(d);
            return line;
        }

        line.y = function(d) {
            y = y.concat(d);
            return line;
        }

        return line;
    };
});
