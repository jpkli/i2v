var colorbrewer = require("../lib/colorbrewer/colorbrewer.js");

module.exports = function Colors(arg){
    "use strict";

    var colors,
        domain = [];

    if(typeof(arg) === "string") colors = brew(arg);
    if(typeof(arg) === "number") colors = brew("Paired", arg);

    function brew(s, n){
        var n = n || 12;

        colors = colorbrewer.Paired["12"];

        if(typeof(s) === "string") {
            if(s in colorbrewer) {
                var a = Object.keys(colorbrewer[s]),
                    l = a.length - 1,
                    m = Math.min(n, parseInt(a[l])).toString();

                colors = colorbrewer[s][m];
            }
        }

        return colors;
    }

    function colorMap(i) {
        var index = domain.indexOf(i);
        if(index>-1){
            return colors[index];
        } else {
            if(domain.length < colors.length){
                domain.push(i);
                return colors[domain.length - 1];
            } else {
                return "#ffffff";
            }
        }
    }

    colorMap.set10a = function() {
        colors = brew("Paired", 10);
        return colorMap;
    }

    colorMap.set10b = function() {
        colors = brew("Set3", 10);
        return colorMap;
    }

    colorMap.set10c = function() {
        colors = [].concat(brew("Set1", 5), brew("Set2", 5));
        return colorMap;
    }

    colorMap.set20a = function() {
        colors = [].concat(brew("Paired", 10), brew("Set3", 10));
        return colorMap;
    }

    colorMap.set20b = function() {
        colors = [].concat(brew("Set1", 8), brew("Accent", 4), brew("Set3", 8));
        return colorMap;
    }

    colorMap.colors = colors;

    return colorMap;
}

// [
//     'YlGn','YlGnBu','GnBu','BuGn','PuBuGn','PuBu',
//     'BuPu','RdPu','PuRd','OrRd','YlOrRd','YlOrBr',
//     'Purples','Blues','Greens','Oranges','Reds','Greys',
//     'PuOr','BrBG','PRGn','PiYG','RdBu','RdGy','RdYlBu',
//     'Spectral','RdYlGn','Accent','Dark2','Paired',
//     'Pastel1','Pastel2','Set1','Set2','Set3'
// ]
