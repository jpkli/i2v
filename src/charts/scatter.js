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
        var scatter = this,
            plot = this.$svg(),
            vmap = option.vmap,
            title = option.title,
            colors = option.colors || ["blue"],
            colorDomain = option.colorDomain || [],
            alpha = option.alpha || 1.0,
            scatter = plot.append("g");

        var domains = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));

        // console.log(domains);

        var x = Axis({
            container: plot,
            dim: "x",
            domain: domains[vmap.x],
            align: "bottom",
            ticks: Math.ceil(this.$width / 50),
            labelPos: {x: 0, y: -20},
            format: format(".3s"),
            grid: 1,
        });

        var y = Axis({
            container: plot,
            dim: "y",
            domain: domains[vmap.y],
            align: "left",
            ticks: Math.ceil(this.$width / 50),
            labelPos: {x: -20, y: -4},
            grid: 1,
            format: format(".3s")
        });

        var color;
        if(typeof(option.colors) == "function") color = option.colors;
        else color = Colors(option.colors);
        if(option.color) color = function() { return option.color; };

        this.data.forEach(function(d, i){
            scatter.append("circle")
                .Attr({
                    cx: x(d[vmap.x]),
                    cy: y(d[vmap.y]),
                    r: 4,
                    "fill-opacity": alpha,
                    fill: color(d[vmap.color])
                    // fill: "none",
                    // "stroke-opacity": alpha,
                    // stroke: color(d[vmap.color])
                });
        });

        scatter.translate(this.$padding.left, this.$padding.top);

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
        if(colorDomain) {
            var that = this;
            colorDomain.forEach(function(d, i){
                var cdLegendWidth = that.$width / colorDomain.length;
                scatter.append("circle")
                    .Attr({
                        cx: i * cdLegendWidth + 10,
                        cy: -that.$padding.top/2 + 5,
                        r: 7,
                        fill: "none",
                        stroke:  colors[i],
                        "stroke-width": 2,
                    });

                scatter.append("text")
                    .attr("x", i*cdLegendWidth + 20)
                    .attr("y", -that.$padding.top/2 + 10)
                    .css("fill", "#222")
                    .css("font-size", "15px")
                    .text(d);

            })
        }
        this.svg.push(plot);
        this.viz();

    });

});
