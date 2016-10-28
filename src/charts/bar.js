if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        scale = require('../metric');

    return Viz.extend(function(option){
        var barHeight = this.$height / (this.data.length),
            barPadding = option.barPadding || 0.2,
            barChart = this.$svg(),
            vmap = option.vmap,
            domain = option.domain,
            bars = barChart.append("g");


        var x = Axis({
            container: barChart,
            dim: "x",
            domain: [0, domain[vmap.size].max],
            scale: "linear",
            align: "bottom",
            // width: this.$width / 2,
            labelPos: {x: 0, y: -20},
            format: d3.format(".3s")
        });

        var y = Axis({
            container: barChart,
            dim: "y",
            // scale: "linear",
            // domain: [domain[vmap.y].min, domain[vmap.y].max],
            scale: "ordinal",
            domain: this.data.map(function(d) { return d[vmap.y]}),
            align: "left",
            ticks: this.data.length,
            tickInterval: "fit",
            tickAlign: "end",
            labelPos: {x: -20, y: -4},
            format: d3.format(".3s")
        });

        var that = this;

        bars.render({
            mark: "rect",
            y: function(d) { return y(d[vmap.y]) + barHeight * barPadding/2; },
            // y: function(d, i) { return (i + 0.05) * barHeight; },
            x: 0,
            height: barHeight * (1-barPadding),
            width: function(d){ return x(d[vmap.size]); },
            fill: "steelblue"
        })(this.data);

        bars.translate(this.$padding.left, this.$padding.top);

        this.svg.push(barChart);
        this.viz();

    });

});
