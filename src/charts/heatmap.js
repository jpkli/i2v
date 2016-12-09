if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var svg = require("../svg"),
        Axis = require('../svg/axis'),
        Viz = require('../viz'),
        WebGL = require('../webgl/webgl'),
        format = require('../format'),
        stats = require('p4/dataopt/stats'),
        scale = require('../metric'),
        Colors = require('../colors');

    return Viz.extend(function ScatterPlot(option){
        var scatter = this,
            plot = this.$svg(),
            vmap = option.vmap,
            title = option.title,
            colors = option.colors || ["blue"],
            colorDomain = option.colorDomain || [],
            alpha = option.alpha || 1.0,
            scatter = plot.append("g");

        var domains = stats.domains(this.data, Object.keys(vmap).map(function(vk) {return vmap[vk];}));

        var x = Axis({
            container: plot,
            dim: "x",
            domain: domains[vmap.x],
            align: "bottom",
            ticks: Math.ceil(this.$width / 50),
            labelPos: {x: 0, y: -20},
            format: format(".3s"),
            grid: 1,
        });

        var y = Axis({
            container: plot,
            dim: "y",
            domain: domains[vmap.y],
            align: "left",
            ticks: Math.ceil(this.$width / 50),
            labelPos: {x: -20, y: -4},
            grid: 1,
            format: format(".3s")
        });

        var webgl = WebGL({
            width: this.$width,
            height: this.$height,
            // container: container,
            padding: {left: 70, top: 20, right: 20, bottom: 50}
        });

        webgl
            .uniform("numGroup", "float", [numGroup])
            .uniform("dim", "vec2", webgl.dimension())
            // .uniform("domain", "vec2", [min, max])
            .uniform("coef", "vec2", [-min/(max-min), 1/(max-min)])
            .attribute("pos", "vec2",  new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0
            ]))
            .texture("data", "float", this.data, [numGroup, numGroup]);

        webgl.shader({
            type: "vertex",
            deps: ["pos"],
            // debug: true
        }, function mainFrag() {
             gl_Position = vec4(pos, 0, 1);
        });

        webgl.shader({
            type: "fragment",
            deps: ["data", "domain", "coef", "dim"],
            // debug: true
        }, function mainFrag() {
            var a, x, y;
            x = (gl_FragCoord.x+0.5) / dim.x;
            y = 1.0 - (gl_FragCoord.y+0.5) / dim.y;
            a = texture2D(data, vec2(x, y)).a;
            a = a * coef.y + coef.x;
            gl_FragColor = vec4(0.9, 0.0, 0.9, a);
        });

        webgl.program("heatmap");
        gl = webgl.ctx;
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        this.svg.push(plot);
        this.addLayer(webgl.canvas);
        this.viz();

    });

});
