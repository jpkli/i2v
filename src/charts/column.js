if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg/svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        scale = require('../metric');

    return Viz.extend(function(option){
        var barWidth = this.$width / (this.data.length),
            barChart = this.$svg(),
            vmap = option.vmap,
            domain = option.domain,
            bars = barChart.append("g");

        var x = Axis({
            container: barChart,
            dim: "x",
            domain: this.data.map(function(d) { return d[vmap.x]}),
            scale: "ordinal",
            align: "bottom",
            labelPos: {x: 0, y: -20},
            format: d3.format(".3s")
        });

        var y = Axis({
            container: barChart,
            dim: "y",
            domain: [0, domain[vmap.size].max],
            align: "left",
            ticks: 8,
            labelPos: {x: -20, y: -4},
            format: d3.format(".2s"),
            // grid: true
        });

        var that = this;
        var height = new scale({
            scale: "linear",
            domain: [0, domain[vmap.size].max],
            range: [0, that.$height]
        });

        bars.render({
            mark: "rect",
            x: function(d, i) { return (i + 0.05) * barWidth; },
            y: function(d) { return y(d[vmap.size]); },
            width: barWidth * 0.9,
            height: function(d){ return that.$height - y(d[vmap.size]); },
            fill: "steelblue"
        })(this.data);

        bars.translate(this.$padding.left, this.$padding.top);

        this.svg.push(barChart);
        this.viz();

    });

});
