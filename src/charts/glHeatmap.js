if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    // "use strict";
    var Viz = require('../viz'),
        axis = require('../svg/axis'),
        format = require('../format'),
        arrays = require('p4/core/arrays'),
        seq = arrays.seq,
        scale = require('../metric'),
        Selector = require('../selector'),
        Colors = require('../colors'),
        FlexGL = require('../../flexgl/flexgl');

    return Viz.extend(function(option){
        var self = this,
            svg = this.$svg(),
            features = option.features,
            vmap = option.vmap,
            title = option.title,
            color = option.color || "blue",
            domains = option.domains,
            plot = svg.append("g"),
            size = option.size,
            onselect = option.onselect || function() {},
            oncomplete = option.oncomplete || function() {},
            hideAxis = option.axis || false,
            selectors = plot.append("g"),
            labels = svg.append("g");

        if (!Array.isArray(color)) {
            color = Colors.rgb(color);
        }

        var fgl = FlexGL({
            height: this.$height,
            width: this.$width,
            padding: this.$padding
        });

        var min = this.data.reduce(function(a, b) { return Math.min(a, b);}),
            max = this.data.reduce(function(a, b) { return Math.max(a, b);});

        fgl.uniform("dim", "vec2", fgl.dimension())
            .uniform("box", "vec2", [0, 0, 0, 0])
            .uniform("filter", "int", 0)
            .uniform("color", "vec3", color)
            .uniform("coef", "vec2", [-min/(max-min), 1/(max-min)])
            .attribute("pos", "vec2",  new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0
            ]))
            .texture("data", "float", new Float32Array(this.data), [size, size]);

        fgl.shader.vertex(function(pos) {
             gl_Position = vec4(pos, 0, 1);
        });

        fgl.shader.fragment(function(dim, coef, data, filter, box, color) {
            var a, x, y;
            x = (gl_FragCoord.x+0.5) / dim.x;
            y = (gl_FragCoord.y+0.5) / dim.y;
            a = texture2D(data, vec2(x, y)).a;
            a = a * coef.y + coef.x;

            $bool(selected) = true;

            if(filter == 1) {
                if(
                    gl_FragCoord.x < box[0].x ||
                    gl_FragCoord.x > box[0].y ||
                    dim.y - gl_FragCoord.y < box[1].x ||
                    dim.y - gl_FragCoord.y > box[1].y
                )
                    selected = false;
            }

            if(selected)
                gl_FragColor = vec4(color, a);
            else
                gl_FragColor = vec4(0.0, 0.0, 0.0, a);
        });

        var gl = fgl.program("heatmap");

        var xAxis = axis({
            container: svg,
            align: "top",
            tickPosition: -5,
            dim: "x",
            scale: "ordinal",
            domain: seq(0, size-1),
            ticks: 10,
            labelPos: {x: 0, y: 0},
            // autoHide: true
            // format: format(".3s")
        });

        var yAxis = axis({
            container: svg,
            dim: "y",
            align: "left",
            scale: "ordinal",
            domain: seq(0, size-1).reverse(),
            ticks: 10,
            labelPos: {x: 0, y: -4},
            // autoHide: true
            // format: format(".3s")
        });

        // if(!hideAxis) {
        //     xAxis.show();
        //     yAxis.show();
        // }

        function update(d) {
            fgl.uniform.box = fgl.uniform.serialize([d.x, d.y]);
            render();
            onselect([yAxis.invert(d.y[0]), yAxis.invert(d.y[1])]);
        }

        new Selector({
            container: plot,
            width: self.$width,
            height: self.$height,
            color: "#DDD",
            x: true,
            y: true,
            brushstart: function(d) { fgl.uniform.filter = 1;},
            brush: update,
            brushend: function(d) {
                update(d);
                oncomplete([yAxis.invert(d.y[0]), yAxis.invert(d.y[1])]);
            }
        })
        var legend = svg.append("g");
        legend.append("g")
          .append("text")
            // .attr("transform", "rotate(-90)")
            .attr("class", "i2v-axis-title")
            .attr("y", 0)
            .attr("x", this.$width/2 + this.$padding.left)
            .attr("dy", ".85em")
            .style('font-size', '1.2em')
            .style("text-anchor", "middle")
            .style(" text-transform", "capitalize")
            .text('group id');

            legend.append("g")
              .append("text")
                .attr("class", "i2v-axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("x", -this.$height/2 - this.$padding.top)
                .attr("dy", ".85em")
                .style('font-size', '1.2em')
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text('group id');
        plot.translate(this.$padding.left, this.$padding.top);


        function render() {
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        render();

        this.canvas.push(fgl.canvas);
        this.render(svg);
    });
});
