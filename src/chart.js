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
            chart = svg.append("g"),
            title = option.title;

        chart.translate(this.$padding.left, this.$padding.top);

        var legend = chart.append("g");

        this.$showLabel = function(dim, pos, text) {
            var label,
                posX0 = this.$width/2 + this.$padding.left,
                posY0 = -this.$height/2 - this.$padding.top,
                presetPos = {
                    x: {
                        top    : [posX0, this.$padding.top/2],
                        middle : [posX0, this.$padding.top + this.$height/2],
                        bottom : [posX0, this.$height + this.$padding.bottom /2 + this.$padding.top]

                    },
                    y: {
                        left   : [posY0, -this.$padding.left / 2],
                        center : [posY0, this.$padding.left + this.$width/2],
                        right  : [posY0, this.$width + this.$padding.left + this.$padding.right / 2]
                    }
                };

            var labelPos = (typeof pos == 'string') ? presetPos[pos] : pos;

            if(dim == 'x') {
                label = (typeof text == 'undefined') ? vmap.x.split("_").join(" ");
                legend.append("g")
                  .append("text")
                    .attr("x", labelPos[0])
                    .attr("y", labelPos[1])
                    .attr("dy", "1em")
                    .css("text-anchor", "middle")
                    .css("font-size", "1em")
                    .css(" text-transform", "capitalize")
                    .text(label);

            } else {
                label = (typeof text == 'undefined') ? vmap.y.split("_").join(" ");
                legend.append("g")
                  .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", labelPos[0])
                    .attr("y", labelPos[1])
                    .attr("dy", "1em")
                    .css("text-anchor", "middle")
                    .css("font-size", "1em")
                    .css("text-transform", "capitalize")
                    .text(label);
            }
        }

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
