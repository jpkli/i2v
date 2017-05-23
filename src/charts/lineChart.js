define(function(require){
    'use strict';
    var svg = require('../svg-proto'),
        axis = require('../svg/axis'),
        line = require('../svg/line'),
        Viz = require('../viz'),
        Selector = require('i2v/selector'),
        colors = require('../colors'),
        scale = require('../metric'),
        arrays = require('p4/core/arrays'),
        query = require('p4/dataopt/query'),
        format = require('../format'),
        stats = require('p4/dataopt/stats');

    return Viz.extend(function stackedArea(option){
        var lineChart = (this instanceof Viz) ? this : {},
            color = option.color || 'steelblue',
            series = option.series || [],
            zero = option.zero || false,
            onchange = option.onchange || function() {},
            lineWidth = option.lineWidth || 2

        var svg = lineChart.$svg(),
            vLines = svg.append("g"),
            legend = svg.append("g"),
            lines = [];

        // vLines.translate( lineChart.$padding.left, lineChart.$padding.top);

        var vmap = lineChart.$vmap,
            formatX = option.formatX || format('.3s'),
            formatY = option.formatY || format('.3s'),
            label = option.label || {x: vmap.x, y: vmap.y};

        var x,
            y,
            domains;

        function configure() {

            var dataX = [], dataY = [], series = [];
            lineChart.data.forEach(function(c){
                dataX = dataX.concat(c.map(function(d){ return d[vmap.x]; }));
                dataY = dataY.concat(c.map(function(d){ return d[vmap.y]; }));
            });

            var domainX = [arrays.min(dataX), arrays.max(dataX)],
                domainY = [arrays.min(dataY), arrays.max(dataY)];

            if(zero) domainY[0] = 0;

            x = axis({
                container: vLines,
                dim: "x",
                domain: domainX,
                align: "bottom",
                width: lineChart.$width,
                height: lineChart.$height,
                ticks: 6,
                // tickInterval: "fit",
                labelPos: {x: 0, y: -20},
                format: formatX
            });

            y = axis({
                container: vLines,
                dim: "y",
                domain: domainY,
                width: lineChart.$width,
                height: lineChart.$height,
                align: "left",
                width: lineChart.$width,
                // tickInterval: "fit",
                ticks: 5,
                labelPos: {x: 0, y: -4},
                format: formatY
            });

            vLines.translate(lineChart.$padding.left, lineChart.$padding.top);
        }

        function init() {
            configure();

            var colorMap;
            if(typeof(vmap.colorMap) == 'function') {
                colorMap = vmap.colorMap;
            } else {
                if(vmap.hasOwnProperty('color')) {
                    colorMap = Array.isArray(color) ? colors(color) : colors();
                } else {
                    colorMap = function() { return color; }
                }
            }
            lineChart.data.forEach(function(d, i){
                var le = vLines
                    .append("path")
                    .attr({
                        stroke: colorMap(d[0][vmap.color]),
                        strokeWidth: lineWidth,
                        fill: 'none',
                        // "fill-opacity": 0.4,
                        // stroke: "blue",
                        d: line({x: d.map(function(di){return x(di[vmap.x])}), y: d.map(function(di){return y(di[vmap.y])})  })()
                    });
                lines.push(le);
            })

            legend.append("g")
              .append("text")
                // .attr("transform", "rotate(-90)")
                .attr("class", "i2v-axis-title")
                .attr("y", lineChart.$height + lineChart.$padding.bottom /2 + lineChart.$padding.top)
                .attr("x", lineChart.$width/2 + lineChart.$padding.left)
                .attr("dy", ".85em")
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(vmap.x.split("_").join(" "));

            legend.append("g")
              .append("text")
                .attr("class", "i2v-axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", lineChart.$padding.left/3 )
                .attr("x", -lineChart.$height/2 - lineChart.$padding.top)
                .attr("dy", ".85em")
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(vmap.y.split("_").join(" "));

            series.forEach(function(si,j){
                var legendPos = lineChart.$width + lineChart.$padding.left/2,
                    // legendWidth = legendPos / Object.keys(series).length;
                    dy = 20;
                legend.append("line")
                    .attr("x1", legendPos-5)
                    .attr("x2", legendPos-20)
                    .attr("y1", 10 + j*dy )
                    .attr("y2", 10 + j*dy)
                    .css("stroke", colorMap(si))
                    .css("stroke-width", 3);

                legend.append("text")
                    .attr("x", legendPos)
                    .attr("y", 15 + j*dy)
                    .css("fill", "#222")
                    .css("font-size", ".9em")
                    .text(si);
            });

            var brushOptions = {
                width: lineChart.$width,
                height: lineChart.$height,
                padding: lineChart.$padding,
                brushstart: null,
                brush: null,
                brushend: null,
            };
            brushOptions.container = vLines;
            brushOptions.x = x.invert;
            brushOptions.brushend = onchange;
            var selector = new Selector(brushOptions);

            lineChart.svg.push(svg);
            lineChart.render();

            return lineChart;
        }

        lineChart.update = function(newData) {
            lineChart.data = newData;
            lineChart.svg.pop();
            x.svg.remove();
            y.svg.remove();
            configure();

            lineChart.data.forEach(function(d, i){
                lines[i].Attr({
                    d: line({x:d[vmap.x], y: d[vmap.y]})(),
                })
            })
        }

        return init();
    });

});
