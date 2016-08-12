if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg/svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        scale = require('../metric');

    return Viz.extend(function(option){
        var plot = this.$svg(),
            vmap = option.vmap,
            scatter = plot.append("g");

        var x = Axis({
            container: plot,
            dim: "x",
            domain: [this.$domain[vmap.x].min, this.$domain[vmap.x].max],
            align: "bottom",
            ticks: Math.floor(this.$width / 80),
            labelPos: {x: 0, y: -20},
            format: d3.format(".3s"),
            // autoHide: true,
        });

        var y = Axis({
            container: plot,
            dim: "y",
            domain: [this.$domain[vmap.y].min, this.$domain[vmap.y].max],
            align: "left",
            ticks: Math.floor(this.$width / 80),
            labelPos: {x: -20, y: -4},
            format: d3.format(".3s")
        });


        this.data.forEach(function(d, i){
            scatter.append("circle")
                .Attr({
                    cx: x(d[vmap.x]),
                    cy: y(d[vmap.y]),
                    r: 4,
                    fill: "none",
                    stroke: "steelblue"
                });
        });

        scatter.translate(this.$padding.left, this.$padding.top);


        var legend = plot.append("g");

        legend.append("g")
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 10)
            .attr("x", -this.$height/2)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")
            .text(vmap.y);

        legend.append("g")
          .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("y", this.$height + this.$padding.bottom )
            .attr("x", this.$width/2 + this.$padding.left)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")
            .text(vmap.x);

        this.svg.push(plot);
        this.viz();

    });

});
