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
            color = option.color || "steelblue",
            domains = option.domains || false,
            plot = svg.append("g"),
            numRows = option.size || this.data.size,
            numDims = features.length,
            showAxis = option.axis || new Array(numDims).fill(1),
            selectors = plot.append("g"),
            formats = option.formats || {},
            axisLabels = option.labels || {},
            labels = svg.append("g");

        var fgl = new FlexGL({
            width: this.$width ,
            height: this.$height,
            padding: this.$padding,
        });
        var rawData = this.data,
            texData = new Float32Array(numRows * numDims);


        var axisDist = this.$width / (numDims-1),
            filterFlag = 0,
            yAxis = new Array(numDims),
            filterDim = new Array(numDims).fill(0),
            filterRanges = new Array(numDims).fill([0,0]);

        var alpha = 0.150;
        fgl.uniform("coef", "vec2", [1/(numRows-1), 1/(numDims-1)])
            .uniform( "uColor", "vec4", Colors.rgba(color, alpha))
            .uniform( "uHighlightColor", "vec4", Colors.rgba('yellow', alpha*2))
            .uniform("domains", "vec2", new Array(numDims*2).fill(0))
            .uniform("filterFlag", "int", 0)
            .uniform("mode", "float", 1)
            .uniform("filterDim", "int", filterDim)
            .uniform("filterRanges", "vec2", fgl.uniform.serialize(filterRanges))
            .attribute("dimension", "float",  new Float32Array(seq(0,numDims-1)))
            .attribute("row", "float",  new Float32Array(seq(0, numRows-1)))
            .framebuffer("filter", "float", [numRows, 1])
            .varying("filterResult", "float")
            .varying("highlightResult", "float")
            .texture("highlightData", "float", new Float32Array(numRows), [numRows, 1])
            .uniform("highlightFlag", "int", 0)
            .texture("data", "float", texData, [numRows, numDims]);

        var texData = this.data;

        features.forEach(function(f, i){
            fgl.texture.data.update(new Float32Array(texData[f]), [0, i], [numRows, 1]);
        });

        if(!domains) {
            domains = {};
            features.forEach(function(f){
                var min = texData[f].reduce(function(a, b) {return ( a < b ? a : b );}),
                    max = texData[f].reduce(function(a, b) {return ( a > b ? a : b );});
                domains[f] = [min, max];
            })
        }


        features.forEach(function(f, i){
            var axisOption = {
                container: svg,
                align: "left",
                position: i * axisDist ,
                dim: "y",
                height: self.$height,
                domain: domains[f],
                tickInterval: "auto",
                ticks: 6,
                labelPos: {x: -5, y: -4},
                format: format(".3s")
                // grid: 1,
            };
            if(formats.hasOwnProperty(f)) axisOption.format = formats[f];
            if(showAxis[i] == 0) axisOption.autoHide = true;

            yAxis[i] = axis(axisOption);
            if(yAxis[i].hasOwnProperty('svg'))
                // yAxis[i].svg.translate(0, self.$padding.bottom+self.$padding.top - 10)

            if(showAxis[i] == 1){
                var axisSelect = selectors.append("g")
                    .translate(axisDist * (i - 0.1), 0);

                new Selector({
                    container: axisSelect,
                    width: axisDist * 0.2,
                    height: self.$height,
                    y: yAxis[i].invert,
                    brushstart: function(d) {
                        if(filterFlag === 0) fgl.uniform.filterFlag = 1;
                        filterDim[i] = 1;

                        fgl.uniform.filterDim = filterDim;
                    },
                    brush: function(d) {
                        filterRanges[i] = d.y;
                        fgl.uniform.filterRanges = fgl.uniform.serialize(filterRanges);
                        // var start = new Date();6
                        compute();
                        render();
                        // console.log(new Date() - start);
                    },
                    brushend: function(d) {
                        filterRanges[i] = d.y;
                        fgl.uniform.filterRanges = fgl.uniform.serialize(filterRanges);
                        compute();
                        render();
                    }
                })

                var labelName = (axisLabels.hasOwnProperty(f)) ? axisLabels[f] : f.split("_").join(" ");
                labels
                .append("text")
                  .attr("y", 0)
                  .attr("x", self.$padding.left + i * axisDist)
                  .attr("dy", "1em")
                  .css("text-anchor", "end")
                  .css("font-size", "1.1em")
                  .text(labelName);
              }
        })

        plot.translate(this.$padding.left, this.$padding.top);


        fgl.shader.vertex(function(
            coef, domains, dimension, row, data,
            filterFlag, filter, filterResult,
            highlightFlag, highlightData, highlightResult
        ) {
            var x, y, r, d, value;

            $int(i);
            i = int(dimension);
            r = row * coef.x;
            d = dimension * coef.y;
            x = d * 2.0 - 1.0;
            value = (texture2D(data, vec2(r, d)).a - domains[i].x) / (domains[i].y - domains[i].x);
            y =  value * 2.0 - 1.0;
            filterResult = 1.0;
            if(filterFlag == 1)
                filterResult = texture2D(filter, vec2(r, 0)).r;

            highlightResult = -1.0;
            if(highlightFlag == 1)
                highlightResult = texture2D(highlightData, vec2(r, 0)).a;

            gl_Position = vec4(x, y, 0.0, 1.0);
        });

        fgl.shader({type:"vertex", name: "filter"},
        function filter(coef, row, dimension, data, filterResult, filterDim, filterRanges) {
            var x, r, d, value;
            gl_PointSize = 1.0;
            filterResult = 1.0;
            r = row * coef.x;

            $int(i);
            i = int(dimension);

            if(filterDim[i] == 1) {
                d = dimension * coef.y;
                value = texture2D(data, vec2(r, d)).a ;
                if( value > filterRanges[i].x || value < filterRanges[i].y)
                    filterResult = 0.0;
            }
            var inverted_width = coef.x / (coef.x + 1.0);
            x = (row+0.5) * inverted_width * 2.0 - 1.0;
            // x = r * 2.0 - 1.0;
            gl_Position = vec4(x, 0, 0.0, 1.0);
        });

        fgl.shader({
            name: "fsFilter",
            type: "fragment",
            // debug: true
        }, function mainFrag(filterResult) {
            gl_FragColor = vec4(filterResult);
        });


        fgl.shader.fragment(function(uColor, filterResult, mode, highlightResult, uHighlightColor) {
            if(filterResult == mode)
                discard;

            if(highlightResult == 0.0) discard;

            if(highlightResult == 1.0)
                gl_FragColor = uHighlightColor;
            else
                gl_FragColor = uColor;
        });

        fgl.program("filter", "filter", "fsFilter");
        fgl.framebuffer.enableRead("filter");
        fgl.program("parallelCoordinate");
        fgl.uniform.domains = fgl.uniform.serialize(yAxis.map(function(d){return d.domain();}));


        function render(highlight) {
            var gl = fgl.program("parallelCoordinate");
            gl.lineWidth(1);
            gl.ext.vertexAttribDivisorANGLE(fgl.attribute.dimension.location, 0);
            gl.ext.vertexAttribDivisorANGLE(fgl.attribute.row.location, 1);
            gl.viewport(0, 0, fgl.canvas.width, fgl.canvas.height);
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.enable( gl.BLEND );
            gl.blendEquation( gl.FUNC_ADD );
            gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

            //draw background lines
            fgl.uniform.mode = 1.0;
            fgl.uniform.uColor = [0.85, 0.85, 0.85, 0.95];
            gl.ext.drawArraysInstancedANGLE(gl.LINE_STRIP, 0, numDims, numRows);


            fgl.uniform.mode = 0.0;
            fgl.uniform.uColor = Colors.rgba(color, alpha);;
            gl.ext.drawArraysInstancedANGLE(gl.LINE_STRIP, 0, numDims, numRows);

            if(typeof highlight == 'number') {
                console.log('highlight');
                fgl.uniform.highlightFlag = 1;
                gl.lineWidth(2);
                gl.ext.drawArraysInstancedANGLE(gl.LINE_STRIP, 0, numDims, numRows);
                fgl.uniform.highlightFlag = 0;
            }

            // if(Array.isArray(ids)) {
            //
            //     var elmBuffer = gl.createBuffer()
            //     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elmBuffer);
            //     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ids), gl.STATIC_DRAW);
            //     gl.enableVertexAttribArray(elmBuffer);
            //     gl.ext.vertexAttribDivisorANGLE(elmBuffer, 0);
            //     // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            //     fgl.uniform.uColor = Colors.rgba('yellow', 1.0);
            //     gl.ext.drawElementsInstancedANGLE(gl.LINE_STRIP, numDims, gl.UNSIGNED_SHORT, 0, ids.length)
            // }
            // gl.finish();

        }

        function compute() {
            fgl.bindFramebuffer("filter");
            var gl = fgl.program("filter");
            gl.viewport(0, 0, numRows, 1);
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MIN_EXT);
            gl.ext.vertexAttribDivisorANGLE(fgl.attribute.dimension.location, 0);
            gl.ext.vertexAttribDivisorANGLE(fgl.attribute.row.location, 1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, numDims, numRows);
            // gl.drawArrays(gl.POINTS, 0, numRows);
            // var result = new Float32Array(numRows*4);
            // gl.readPixels(0, 0, numRows, 1, gl.RGBA, gl.FLOAT, result);
            // result.forEach(function(d, i){
            //     if(i%4==0 && d == 1) console.log(i/4, d);
            // })
            // gl.finish();
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        this.result = function() {
            fgl.bindFramebuffer("filter");
            var result = new Float32Array(numRows*4);
            var gl = fgl.ctx;
            gl.readPixels(0, 0, numRows, 1, gl.RGBA, gl.FLOAT, result);

            return result;
        }
        render();

        this.domain = function() {
            return filterRanges;
        }

        this.filter = function(dimID, range) {
            filterDim[dimID] = 1;
            fgl.uniform.filterFlag = 1;
            filterRanges[dimID] = range;
            fgl.uniform.filterRanges = fgl.uniform.serialize(filterRanges);
            compute();
            render();
        }

        this.update = function(newData) {
            fgl.texture.data = new Float32Array(newData);
        }

        this.highlight = function(filter) {
            fgl.uniform.filterFlag = 1;
            fgl.texture.filter = filter;
            // compute();
            render();
        }

        this.select = function(ids) {
            fgl.texture.highlightData = new Float32Array(ids);
            render(1);
        }

        this.canvas.push(fgl.canvas);
        this.render(svg);
    });
});
