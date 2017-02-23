define(function(require){
    'use strict';
    var svg = require('../svg-proto'),
        area = require('../svg/area'),
        line = require('../svg/line'),
        Axis = require('../svg/axis'),
        Selector = require('../selector'),
        Viz = require('../viz'),
        Colors = require('../colors'),
        scale = require('../metric'),
        array = require('p4/core/arrays'),
        query = require('p4/dataopt/query'),
        format = require('../format'),
        stats = require('p4/dataopt/stats');

    return Viz.extend(function stackedArea(option){
        var sac = (this instanceof Viz) ? this : {};

        var stackedAreaChart = sac.$svg(),
            stackedAreas = stackedAreaChart.append("g"),
            legend = stackedAreaChart.append("g"),
            areas = [];

        stackedAreas.translate(sac.$padding.left, sac.$padding.top);

        var selector,
            vmap = sac.$vmap,
            color = Colors(["steelblue", "orange", "purple"]),
            formatX = option.formatX || format('.3s'),
            label = option.label || {x: vmap.x, y: vmap.y};

        var brush = {
            brushstart: function(){},
            brush: function(){},
            brushend: function() {}
        };

        if(option.hasOwnProperty("brush")) brush = option.brush;
        brush.width = sac.$width;
        brush.height = sac.$height;

        var x,
            y,
            domains,
            attributes = [];

        function configure() {
            Object.keys(vmap).forEach(function(vk) {
                if(Array.isArray(vmap[vk])) attributes = attributes.concat(vmap[vk]);
                else attributes.push(vmap[vk]);
            })

            domains = stats.domains(sac.data, attributes);
            var domainY = [domains[vmap.y[1]][0], domains[vmap.y[0]][1]];

            vmap.y.slice(1).forEach(function(vy){
                if(domains[vy][1] > domainY[1]) domainY[1] = domains[vy][1];
                if(domains[vy][0] < domainY[0]) domainY[0] = domains[vy][0];
            });

            x = Axis({
                container: stackedAreaChart,
                dim: "x",
                domain: domains[vmap.x],
                align: "bottom",
                // ticks: 7,
                // tickInterval: "fit",
                labelPos: {x: 0, y: -20},
                format: formatX
            });

            console.log(domainY);
            y = Axis({
                container: stackedAreaChart,
                dim: "y",
                domain: domainY,
                align: "left",
                // tickInterval: "fit",
                // ticks: 4,
                labelPos: {x: 0, y: -4},
                format: format(".2s")
            });
        }

        function transform() {
            var data = query.toColumnArray(sac.data);
            var results = [];
            vmap.y.forEach(function(vy, vi){
                var series;
                if(vi < vmap.y.length-1) {
                    series = {
                        x: data[vmap.x].map(function(d){ return x(d); }),
                        y: data[vmap.y[vi]].map(function(d){ return y(d); }),
                        y1: data[vmap.y[vi+1]].map(function(d){ return y(d); })
                    };
                } else {
                    series = {
                        x: data[vmap.x].map(function(d){ return x(d); }),
                        y: data[vmap.y[vi]].map(function(d){ return y(d); }),

                    };
                }
                results.push(series);
            });
            return results;
        }

        function init() {
            configure();
            var results = transform();

            vmap.y.forEach(function(vy, vi){
                var ar = stackedAreas
                    .append("path")
                    .Attr({
                        fill: color(vy),
                        // "fill-opacity": 0.4,
                        // stroke: "blue",
                        d: area(results[vi])(),
                    })

                areas.push(ar);
            })


            legend.append("g")
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 5)
                .attr("x", - sac.$height/2 - sac.$padding.bottom/2 )
                .attr("dy", ".95em")
                .css("font-size", "16px")
                .css("text-anchor", "middle")
                .text(label.y);

            legend.append("g")
              .append("text")
                // .attr("transform", "rotate(-90)")
                .attr("y", sac.$height + sac.$padding.top + 20 )
                .attr("x", sac.$width/2 + sac.$padding.left)
                .attr("dy", ".95em")
                .css("text-anchor", "middle")
                .css("font-size", "16px")
                .text(label.x);

            vmap.y.forEach(function(si,j){
                var legendPos = sac.$width - 40,
                    // legendWidth = legendPos / Object.keys(series).length;
                    legendWidth = 180;
                legend.append("rect")
                    .attr("x", legendPos-15-j*legendWidth)
                    .attr("y", 15)
                    .attr("width", 10)
                    .attr("height", 10)
                    .css("fill", color(si));
                    // .css("stroke-width", 3);

                legend.append("text")
                    .attr("x", legendPos-j*legendWidth)
                    .attr("y", 25)
                    .css("fill", "#222")
                    .css("font-size", "16px")
                    .text(si.split("_").join(" "));
            });

            if(brush.x || brush.y){
                brush.x = x.invert;
                // brush.y = y;
                brush.container = stackedAreas;
                selector = new Selector(brush);
            }

            sac.svg.push(stackedAreaChart);
            sac.viz();

            return sac;
        }

        sac.update = function(newData) {
            sac.data = newData;
            sac.svg.pop();
            x.svg.remove();
            y.svg.remove();
            configure();

            if(brush.x || brush.y){
                selector.x(x.invert);
            }
            var results = transform();
            vmap.y.forEach(function(vy, vi){
                areas[vi].Attr({
                    d: area(results[vi])(),
                })
            })
        }

        return init();
    });

});
