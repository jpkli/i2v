if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        format = require('../format'),
        stats = require('p4/dataopt/stats'),
        scale = require('../metric'),
        Colors = require('../colors');

    return Viz.extend(function ScatterPlot(option){
        var svg = this.$svg(),
            chart = plot.append("g"),
            title = option.title;

        chart.translate(this.$padding.left, this.$padding.top);

        var legend = plot.append("g");

        legend.append("g")
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 10)
            .attr("x", -this.$height/2 - this.$padding.top)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")
            .css("font-size", "16px")
            .css(" text-transform", "capitalize")
            .text(vmap.y.split("_").join(" "));

        legend.append("g")
          .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", this.$height + this.$padding.bottom /2 + this.$padding.top )
            .attr("x", this.$width/2 + this.$padding.left)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")
            .css("font-size", "16px")
            .css(" text-transform", "capitalize")
            .text(vmap.x.split("_").join(" "));

        if(option.title) {
            legend.append("g")
              .append("text")
                .attr("y", this.$padding.top / 2 - 5)
                .attr("x", this.$padding.left + this.$width/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .css("font-size", "1.2em")
                .text(option.title);
        }

        this.render(chart);
    });
});
