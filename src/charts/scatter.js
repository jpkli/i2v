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
            axisOptions = option.axis || false,
            scatter = plot.append("g");
        var that = this;
        var domains = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));

        var xAxisOptions = {
            container: plot,
            dim: "x",
            domain: domains[vmap.x],
            align: "bottom",
            tickPosition: 10,
            ticks: Math.ceil(this.$width / 60),
            tickInterval: "fit",
            labelPos: {x: 0, y: -25},
            tickPosition: 0,
            format: format(".3s"),
            grid: 1
        };

        var yAxisOptions = {
            container: plot,
            dim: "y",
            domain: domains[vmap.y],
            // scale: "power",
            // exponent: 0.2,
            align: "left",
            tickInterval: "fit",
            ticks: Math.ceil(this.$height / 60),
            labelPos: {x: -5, y: -4},
            grid: 1,
            format: format(".3s")
        };

        if(axisOptions.hasOwnProperty('x')) {
            for (var prop in axisOptions.x) {
                xAxisOptions[prop] = axisOptions.x[prop];
            };
        }

        if(axisOptions.hasOwnProperty('y')) {
            for (var prop in axisOptions.y) {
                yAxisOptions[prop] = axisOptions.y[prop];
            };
        }

        var x = Axis(xAxisOptions), y = Axis(yAxisOptions);
        var color, marks = [];

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
        var highlighted = [];
        this.highlight = function(feature, selected, color) {
            var hColor = color || 'yellow';

            selected.forEach(function(si, ii){
                // console.log(x(that.data[si][vmap.x]));
                highlighted[ii] = scatter.append("circle")
                    .Attr({
                        cx: x(that.data[si][vmap.x]),
                        cy: y(that.data[si][vmap.y]),
                        r: size,
                        fill: hColor
                    });
            });
        }

        this.unhighlight = function() {
            highlighted.forEach(function(hi){
                hi.remove();
            });
            highlighted = [];
        }

        this.selectRange = function(feature, range) {
            var min = Math.min(range[0], range[1]),
                max = Math.max(range[0], range[1]);
            this.data.forEach(function(d,i){
                if(d[feature] <= min || d[feature] >= max)
                    marks[i].attr("fill", "none");
                else
                    marks[i].attr("fill", color(d[vmap.color]));
            });
        }

        scatter.translate(this.$padding.left, this.$padding.top);

        var legend = plot.append("g");

        if(yAxisOptions.label) {
            var yAxisPosition = (yAxisOptions.align == 'left') ? 0 : (this.$width + this.$padding.left + this.$padding.right/2 + 5),
                axisTitle = (typeof yAxisOptions.label == 'string') ? yAxisOptions.label : vmap.y.split("_").join(" ");
            legend.append("g")
              .append("text")
                .attr("class", "i2v-axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", yAxisPosition)
                .attr("x", -this.$height/2 - this.$padding.top)
                .attr("dy", ".85em")
                .style('font-size', '1.5em')
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(axisTitle);
        }


        if(xAxisOptions.label) {
            var xAxisPosition = (xAxisOptions.align == 'top') ? 0 : (this.$height + this.$padding.bottom /2 + this.$padding.top),
                axisTitle = (typeof xAxisOptions.label == 'string') ? xAxisOptions.label : vmap.x.split("_").join(" ");
            legend.append("g")
              .append("text")
                // .attr("transform", "rotate(-90)")
                .attr("class", "i2v-axis-title")
                .attr("y", xAxisPosition)
                .attr("x", this.$width/2 + this.$padding.left)
                .attr("dy", ".85em")
                .style('font-size', '1.2em')
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(axisTitle);
            }

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

            colorDomain.forEach(function(d, i){
                var cdLegendWidth = that.$width / colorDomain.length;
                scatter.append("circle")
                    .Attr({
                        cx: that.$padding.right + i * cdLegendWidth ,
                        cy: -size*2 ,
                        r: size,
                        // fill: "none",
                        fill:  colors[i],

                    });
                scatter.append("text")
                    .attr("class", "i2v-legend-label")
                    .attr("x", that.$padding.right + i*cdLegendWidth + 10)
                    .attr("y", -size)
                    .css("fill", "#222")
                    .text(d);
            })
        }

        this.svg.push(plot);
        this.viz();
    });
});
