if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg-proto"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        format = require('../format'),
        stats = require('p4/dataopt/stats'),
        scale = require('../metric'),
        Colors = require('../colors');

    return Viz.extend(function ScatterPlot(option){
        var plot = this.$svg(),
            vmap = option.vmap,
            title = option.title,
            colors = option.colors || ["blue"],
            size = option.size || 5,
            colorDomain = option.colorDomain || [],
            alpha = option.alpha || 0.7,
            scatter = plot.append("g");

        var domains = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));

        var marks = [];

        var x = Axis({
            container: plot,
            // width: this.$width,
            // height: this.$height,
            dim: "x",
            domain: domains[vmap.x],
            align: "bottom",
            tickPosition: 10,
            ticks: Math.ceil(this.$width / 50),
            tickInterval: "fit",
            labelPos: {x: 0, y: -25},
            tickPosition: 0,
            format: format(".3s"),
            grid: 1,
        });

        var y = Axis({
            container: plot,
            // width: this.$width,
            // height: this.$height,
            dim: "y",
            domain: domains[vmap.y],
            align: "left",
            tickInterval: "fit",
            ticks: Math.ceil(this.$width / 50),
            labelPos: {x: -5, y: -4},
            // tickPosition: 5,
            grid: 1,
            format: format(".3s")
        });

        var color;
        if(typeof(option.colors) == "function") color = option.colors;
        else color = Colors(option.colors);
        if(option.color) color = function() { return option.color; };

        this.data.forEach(function(d, i){
            var mark = scatter.append("circle")
                .Attr({
                    cx: x(d[vmap.x]),
                    cy: y(d[vmap.y]),
                    r: size,
                    "fill-opacity": alpha,
                    fill: color(d[vmap.color])
                    // fill: "none",
                    // "stroke-opacity": alpha,
                    // stroke: color(d[vmap.color])
                });

            marks.push(mark);
        });

        this.select = function(feature, selected) {
            var selectedID = [];
            this.data.forEach(function(d, i){
                if(selected.indexOf(d[feature]) > -1)
                    selectedID.push(i);
            });

            marks.forEach(function(mark){
                mark.attr("fill-opacity", 0.1);
            });

            selectedID.forEach(function(si){
                marks[si].attr("fill-opacity", alpha);
            });
        }

        scatter.translate(this.$padding.left, this.$padding.top);

        var legend = plot.append("g");

        legend.append("g")
          .append("text")
            .attr("class", "i2v-axis-title")
            .attr("transform", "rotate(-90)")
            // .attr("y", this.$width + this.$padding.left + this.$padding.right - 20)
            .attr("y", 0)
            .attr("x", -this.$height/2 - this.$padding.top)
            .attr("dy", ".85em")
            .style("text-anchor", "middle")
            .style(" text-transform", "capitalize")
            .text(vmap.y.split("_").join(" "));

        legend.append("g")
          .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("class", "i2v-axis-title")
            .attr("y", this.$height + this.$padding.bottom /2 + this.$padding.top )
            // .attr("y", 0)
            .attr("x", this.$width/2 + this.$padding.left)
            .attr("dy", ".85em")
            .style("text-anchor", "middle")
            .style(" text-transform", "capitalize")
            .text(vmap.x.split("_").join(" "));

        if(option.title) {
            legend.append("g")
              .append("text")
                .attr("class", "i2v-chart-title")
                .attr("y", 0)
                .attr("x", this.$padding.left + this.$width/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .text(option.title);
        }
        if(colorDomain) {
            var that = this;
            colorDomain.forEach(function(d, i){
                var cdLegendWidth = that.$width / colorDomain.length;
                scatter.append("circle")
                    .Attr({
                        cx: that.$padding.left + i * cdLegendWidth + 10,
                        cy: -size*2 ,
                        r: size,
                        // fill: "none",
                        fill:  colors[i],

                    });
                scatter.append("text")
                    .attr("class", "i2v-legend-label")
                    .attr("x", that.$padding.left + i*cdLegendWidth + 20)
                    .attr("y", -size)
                    .css("fill", "#222")
                    .text(d);
            })
        }
        this.svg.push(plot);
        this.viz();
    });
});
