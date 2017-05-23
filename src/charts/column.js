if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg/svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        stats = require('p4/dataopt/stats'),
        Selector = require('../selector'),
        scale = require('../metric'),
        printformat = require('../format');

    return Viz.extend(function(option){
        var barWidth = this.$width / (this.data.length),
            barChart = this.$svg(),
            data = this.data,
            vmap = option.vmap,
            color = option.color || "steelblue",
            domain = option.domain,
            scales = option.scales,
            format = option.format || printformat(".3s"),
            onclick = option.onclick || function(d) {console.log(d);},
            bars = barChart.append("g");

        domain = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));

        var brush = {
            brushstart: function(){},
            brush: function(){},
            brushend: function() {}
        };

        if(option.hasOwnProperty("brush")) brush = option.brush;
        brush.width = this.$width;
        brush.height = this.$height;

        // if(brush.x || brush.y){
            brush.x = x;
            // brush.y = y;
            brush.container = barChart;
            var selector = new Selector(brush);
        // }

        var x = Axis({
            container: barChart,
            dim: "x",
            domain: this.data.map(function(d) { return d[vmap.x];}),
            scale:  "ordinal",
            align: "bottom",
            ticks: 10,
            labelPos: {x: 0, y: -20},
            // format: d3.format(".3s")
        });

        var y = Axis({
            container: barChart,
            dim: "y",
            domain: [0, domain[vmap.size][1]],
            align: "left",
            ticks: 5,
            labelPos: {x: -2, y: -4},
            format: format,
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

        var columns = [], selected = [], selectedData = [];

        this.highlight = function(selected) {
            columns.forEach(function(c){
                c.attr("fill", color);
            });
            selected.forEach(function(si){
                columns[si].attr("fill", "orange");
            });
        }

        this.data.forEach(function(d, i){
            var bar = bars.append("rect")
                .Attr({
                    x: x(d[vmap.x]) - barWidth*0.4,
                    y: y(d[vmap.size]),
                    width: barWidth * 0.8,
                    height: that.$height - y(d[vmap.size]),
                    fill: colorScale(d[vmap.color])
                });

            // bar.svg.onclick = function() {
            //     console.log(that.data[i].pid);
            // }

            columns.push(bar);

            bar.svg.onclick = function(evt) {
                if(evt.shiftKey) {
                    selected.push(i);
                    selectedData.push(data[i]);
                } else {
                    selected = [i];
                    selectedData = [data[i]];
                }
                that.highlight(selected);
                // bar.svg.attr("fill", "#A00");
                onclick(selectedData);
            }

        });

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

        if(option.title) {
            legend.append("g")
              .append("text")
                .attr("class", "i2v-chart-title")
                .attr("y", this.$padding.top / 2 - 5)
                .attr("x", this.$padding.left + this.$width/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")

                .text(option.title);
        }

        var titleX = option.titleX || vmap.x.split("_").join(" "),
            titleY = option.titleY || vmap.size.split("_").join(" ");

        legend.append("g")
          .append("text")
            .attr("class", "i2v-axis-title")
            .attr("transform", "rotate(-90)")
            .attr("y", 10)
            .attr("x", -this.$height/2 - this.$padding.top)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")

            .css(" text-transform", "capitalize")
            .text(titleY);

        legend.append("g")
          .append("text")
            .attr("class", "i2v-axis-title")
            // .attr("transform", "rotate(-90)")
            .attr("y", this.$height + this.$padding.bottom /2 + this.$padding.top )
            .attr("x", this.$width/2 + this.$padding.left)
            .attr("dy", ".85em")
            .css("text-anchor", "middle")

            .css(" text-transform", "capitalize")
            .text(titleX);

        this.svg.push(barChart);
        this.viz();

    });

});
