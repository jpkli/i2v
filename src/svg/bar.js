var svg = require("./svg"),
    Viz = require('../viz');

module.exports = Viz.extend(function(){
    var g = svg();
    g.append("g").append("rect").Attr({x: 100, y: 100, height: 50, width:50})
    console.log("svg1", g.node);
    this.svg.push(g);
    this.viz();
});
