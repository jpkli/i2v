define(function(require){
    var Scale = require('../scale');

    return function axis(arg) {
        'use strict';
        var option      = arg || {},
            svg         = option.container || option.parent,
            dim         = option.dim || "x",
            labelPos    = option.labelPos || option.labelPosition || {x: 0, y: 0},
            labelAngel  = option.labelAngle || option.labelAngel || 0,
            color       = option.color || "#000",
            position    = option.position || 0,
            align       = option.align || "",
            scale       = option.scale || "linear",
            exponent    = option.exponent || 1,
            metric      = option.metric || null,
            domain      = option.domain || [0,1],
            width       = option.width || svg.innerWidth(),
            height      = option.height || svg.innerHeight(),
            padding     = option.padding || svg.padding() || {left: 0, right: 0, top: 0, bottom: 0},
            range       = option.range || (dim == "x") ? [0, width] : [height, 0],
            styles      = {stroke: color, 'stroke-width': 0.7},
            ticks       = option.ticks,
            tickLength  = option.tickLength || 6,
            tickPosition = option.tickPosition || [0, 0],
            tickInterval= option.tickInterval || "auto",
            tickAlign = option.tickAlign || "center",
            tickFormat  = option.tickFormat || null,
            grid        = option.grid,
            format      = option.format || function(_){return _;},
            autoHide    = option.autoHide || false,
            domainIntervals,
            X = [],
            Y = [];

        if (range === null){
            range = (dim == "x") ? [0, width] : [0,height];
        }

        if(typeof(ticks) != "number") {
            ticks = (dim == "x") ? Math.ceil(width/60) : Math.ceil(height/60);
        }


        function getTickInterval(){
            var vDomain = Math.abs(domain[1] - domain[0]),
                intv = vDomain / ticks,
                pow = Math.ceil(Math.log10(intv)),
                intv = intv / Math.pow(10, pow);

            if(intv > 0.2 && intv <= 0.25){
                intv = 0.25;
            } else if(intv > 0.7 && intv <= 0.75) {
                intv = 0.75;
            } else {
                intv = Math.ceil(intv * 10) / 10;
            }
            return intv * Math.pow(10, pow);
        }


        if (scale == "categorical" || scale == "ordinal") {
            domainIntervals = function() {
                var len = domain.length,
                    step = Math.ceil(len / ticks),
                    intervals = [],
                    i;
                for(i = 0; i < len; i += step) {
                    intervals.push(domain[i])
                }
                // if(intervals[i] != domain[len-1]) intervals.push(domain[len-1]);

                return intervals;
            };
        } else {
            var intv;

            if(tickInterval == "auto"){
                intv = getTickInterval();

            } else {
                if(typeof(tickInterval) == "number") {
                    intv = tickInterval;
                } else {
                    // intv = Math.abs(domain[1] - domain[0]) / ticks;
                    intv = getTickInterval();
                    domain[0] = intv * Math.floor(domain[0]/intv);
                    domain[1] = intv * Math.ceil(domain[1]/intv);
                }
            }

            domainIntervals = function() {
                var di = [];

                if(domain[0] > domain[1]) {
                    domain[0] += intv;
                    for(var i = domain[0]; i > domain[1]; i=i-intv)
                        di.push(i);
                } else {
                    for(var i = domain[0]; i < domain[1]; i=i+intv)
                        di.push(i);
                }

                if(di[di.length-1]!=domain[1] && !isNaN(domain[1])){

                    if((domain[1] - di[di.length-1]) < 0.6 * intv)
                        di[di.length-1] = domain[1];
                    else
                        di.push(domain[1]);
                }
                return di;
            }
        }

        if (metric === null) {

            var scaleOptions = {
                align: tickAlign,
                type: scale,
                domain: domain,
                range: range
            };

            if(scale == "power") {
                scaleOptions.exponent = exponent;
            }

            metric = new Scale(scaleOptions)
        } else {
            domain = metric.domain();
        }

        var axis = svg.append("g");

        if(dim == 'x') {
            if(!position && align) {
                position = [0,height/2,height];
                position = position[["top", "middle", "bottom"].indexOf(align)];
            }
            Y[0] = Y[1] = position;
            X[0] = 0;
            X[1] = Math.abs(range[1] - range[0]);
        } else {
            if(!position && align) {
                position = [0, width/2, width];
                position = position[["left", "center", "right"].indexOf(align)];
            }
            X[0] = X[1] = position;
            Y[0] = 0;
            Y[1] = Math.abs(range[1] - range[0]);
        }

        metric.show = metric.axis = function() {
            axis.append("g")
                .append("line")
                .Attr({x1: X[0], x2: X[1], y1: Y[0], y2: Y[1]})
                .Style(styles);

            var di = domainIntervals();

            for(var i = 0; i < di.length; i++) {
                var x1,x2,y1,y2;
                if(dim == 'x'){
                    x1 = x2 = metric(di[i]) + tickPosition[0];
                    y1 = position + tickPosition[1] + tickLength;
                    y2 = y1 - tickLength;
                } else {
                    if(scale == "categorical" || scale == "ordinal")
                        y1 = y2 = height - metric(di[i]);
                    else
                        y1 = y2 = metric(di[i]) + tickPosition[1];
                    x1 = position + tickPosition[0] ;
                    x2 = x1 - tickLength;
                }

                var svgTicks = axis.append("g");
                svgTicks.append("line", {
                    x1: x1,
                    x2: x2,
                    y1: y1,
                    y2: y2,
                }, styles);

                var tickLabelAlign = "end";
                if(align=="right") tickLabelAlign = "begin";
                if (dim == 'x') tickLabelAlign = "middle";
                if (dim == 'x' && labelAngel) tickLabelAlign = "end";

                var tickLabel = svgTicks.append("text")
                    .Attr({
                        x: x2 + labelPos.x,
                        y: y2 - labelPos.y,
                        // class: "labels",
                        class: "i2v-axis-label",
                        "font-size": "1.0em",
                        textAnchor: tickLabelAlign
                    });
                if(labelAngel) tickLabel.attr("transform", "rotate(" + [labelAngel, (x2 + labelPos.x), (y2 - labelPos.y)].join(",")+")");

                var labelText = (typeof(tickFormat) == "function") ? format(tickFormat(di[i])) : format(di[i]) ;
                // tickLabel.appendChild( document.createTextNode(labelText) );
                tickLabel.text(labelText);

                if(grid) {
                    var gx1, gx2, gy1, gy2;
                    if(dim == 'x'){
                        gx1 = gx2 = metric(di[i]);
                        gy1 = 0;
                        gy2 =height;
                    } else {
                        gy1 = gy2 = metric(di[i]);
                        gx1 = 0;
                        gx2 = width;
                    }
                    axis.append("line", {x1: gx1, x2: gx2, y1: gy1, y2: gy2, class: "grid-lines"}, styles);
                }
            }
            axis.translate(padding.left, padding.top);
            return axis;
        };

        metric.remove = function() {
            axis.remove();
        }

        if(!autoHide) {
            metric.svg = metric.show();
        }

        return metric;
    };
});
