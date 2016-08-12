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
            domain: [0, domain[vmap.x].max],
            align: "bottom",
            ticks: 12,
            labelPos: {x: 0, y: -20},
            format: function(n) { return (n / 1000000).toFixed(2) + "ms"; }
        });

        // var height = new scale({
        //     scale: "linear",
        //     domain: [domain[vmap.size].min, domain[vmap.size].max],
        //     range: [0, this.$height]
        // });

        var y = Axis({
            container: barChart,
            dim: "y",
            domain: [0, domain[vmap.size[0]].max],
            align: "left",
            ticks: 8,
            labelPos: {x: -20, y: -4},
            format: d3.format(".2s")
        });

        var that = this;

        var colors = ["steelblue", "orange"]

        var height = new scale({
            scale: "linear",
            domain: [0, domain[vmap.size[0]].max],
            range: [0, that.$height]
        });

        this.data.forEach(function(d, i){
            vmap.size.forEach(function(vm, vi){
                bars.append("rect")
                    .Attr({
                        x: (i + 0.05) * barWidth,
                        y: that.$height - height(d[vm]),
                        width: barWidth * 0.9,
                        height: height(d[vm]),
                        fill: colors[vi]
                    })
            });

        });
        bars.translate(this.$padding.left, this.$padding.top);

        this.svg.push(barChart);
        this.viz();

    });

});
