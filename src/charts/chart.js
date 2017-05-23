if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var Viz = require('../viz'),
        Axis = require('../svg/axis'),
        Selector = require('../selector'),
        stats = require('p4/dataopt/stats'),
        scale = require('../metric');

    return Viz.extend(function Chart(option){
        var chart = (this instanceof Viz) ? this : {};
        chart._substrate = this.$svg();
        chart._vmap = option.vmap;
        chart._color = option.color || "steelblue";
        var domain = option.domain,
            scales = option.scales,
            onclick = option.onclick || function(d) {console.log(d);},
            bars = barChart.append("g");

        // domain = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));


        chart.highlight = function() {

        };

        var brush = {
            brushstart: function(){},
            brush: function(){},
            brushend: function() {}
        };

        if(option.hasOwnProperty("brush")) brush = option.brush;
        brush.width = this.$width;
        brush.height = this.$height;

        if(brush.x || brush.y){
            brush.x = x;
            // brush.y = y;
            brush.container = barChart;
            selector = new Selector(brush);
        }

        var x = Axis({
            container: barChart,
            dim: "x",
            domain: [0, this.data.length-1],
            scale:  "linear",
            align: "bottom",
            labelPos: {x: 0, y: -20},
            // format: d3.format(".3s")
        });

        var y = Axis({
            container: barChart,
            dim: "y",
            domain: [0, domain[vmap.size][1]],
            align: "left",
            ticks: 5,
            labelPos: {x: -20, y: -4},
            format: d3.format(".3s"),
            // grid: true
        });

        var colorScale = function(d) { return color; };
        if(vmap.color)
        colorScale = d3.scale.linear().domain(domain[vmap.color]).range(["blue", "red"]);

        var that = this;
        var height = new scale({
            scale: "linear",
            domain: domain[vmap.size],
            range: [0, that.$height]
        });

        var columns = [];

        // this.data.forEach(function(d, i){
        //     var bar = bars.append("rect")
        //         .Attr({
        //             x: (i + 0.05) * barWidth,
        //             y: y(d[vmap.size]),
        //             width: barWidth * 0.9,
        //             height: that.$height - y(d[vmap.size]),
        //             fill: colorScale(d[vmap.color])
        //         });
        //
        //     columns.push(bar);
        //
        //     bar.onclick = function() {
        //         columns.forEach(function(c){
        //             c.attr("fill", color);
        //         });
        //         this.attr("fill", "#A00");
        //         onclick(i);
        //     }
        //
        // });

        // bars.render({
        //     mark: "rect",
        //     x: function(d, i) { return (i + 0.05) * barWidth; },
        //     y: function(d) { return y(d[vmap.size]); },
        //     width: barWidth * 0.9,
        //     height: function(d){ return that.$height - y(d[vmap.size]); },
        //     fill: function(d) { return colorScale(d[vmap.color]); }
        // })(this.data);

        bars.translate(this.$padding.left, this.$padding.top);

        var legend = barChart.append("g");

        // legend.append("g")
        //   .append("text")
        //     .attr("transform", "rotate(-90)")
        //     .attr("y", 10)
        //     .attr("x", -this.$height/2 - this.$padding.top)
        //     .attr("dy", ".85em")
        //     .css("text-anchor", "middle")
        //     .css("font-size", "16px")
        //     .css(" text-transform", "capitalize")
        //     .text(vmap.size.split("_").join(" "));
        //
        // legend.append("g")
        //   .append("text")
        //     // .attr("transform", "rotate(-90)")
        //     .attr("y", this.$height + this.$padding.bottom /2 + this.$padding.top )
        //     .attr("x", this.$width/2 + this.$padding.left)
        //     .attr("dy", ".85em")
        //     .css("text-anchor", "middle")
        //     .css("font-size", "16px")
        //     .css(" text-transform", "capitalize")
        //     .text(vmap.x.split("_").join(" "));

        this.svg.push(barChart);
        this.viz();

    });

});
