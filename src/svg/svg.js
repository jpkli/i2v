var Metric = require('../metric');

module.exports = function Svg(arg){
    var svgNS = "http://www.w3.org/2000/svg";
        svg = document.createElementNS(svgNS, 'svg'),
        option = arg || {},
        width = option.width || 400,
        height = option.height || 300,
        padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0};

    var defaultAttr = {
            width   : width,
            height  : height,
            viewBox : [0, 0, width, height].join(" "),
            preserveAspectRatio: "none"
    };

    setAttr(svg, defaultAttr);

    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    function setAttr(elem, attr) {
        for( var key in attr ){
            elem.setAttribute(key, attr[key]);
        }
    }

    function setStyle(elem, style) {
        for( var key in style ){
            elem.style[key] = style[key];
        }
    }

    function append(parent, type, attr, style) {
        var obj = document.createElementNS(svgNS, type);

        if(attr) setAttr(obj, attr);
        if(style) setStyle(obj, style);
        parent.appendChild(obj);

        obj.append = function(type, attr, style){
            return append(obj, type, attr, style);
        };

        obj.attr = function(a, v){
            obj.setAttribute(a, v);
            return obj;
        };

        obj.css = function(a, v){
            obj.style[a] = v;
        };

        obj.Attr = function(a) {
            setAttr(obj, a);
            return obj;
        }

        obj.CSS = obj.Style = function(a) {
            setStyle(obj, a);
            return obj;
        }

        obj.text = function(str){
            obj.appendChild(document.createTextNode(str));
            return obj;
        };

        obj.translate = function(x, y) {
            var p = obj.getAttribute("transform") || "";
            obj.setAttribute("transform", p + "translate(" + [x,y].join(",") + ") ");
            return obj;
        };

        obj.rotate = function(a, x, y) {
            var p = obj.getAttribute("transform") || "";
            obj.setAttribute("transform", p + "rotate(" + [a,x,y].join(",") + ") ");
            return obj;
        };

        obj.scale = function(x, y) {
            var p = obj.getAttribute("transform") || "";
            obj.setAttribute("transform", p + "scale(" + [x,y].join(",") + ") ");
            return obj;
        };

        return obj;
    }

    svg.append = function(type, attr, style) {
        return append(svg, type, attr, style);
    }

    svg.axis = function(arg) {
        var option      = arg || {},
            // margin = option.margin || {left: 0, right: 0, top: 0, bottom: 0},
            dim         = option.dim || "x",
            labelPos    = option.labelPos || option.labelPosition || {x: 0, y: 0},
            labelAngel  = option.labelAngel || 0,
            ticks       = option.ticks || 5,
            tickLength  = option.tickLength || 6,
            tickPostion = option.tickPostion || 0,
            tickInterval= option.tickInterval || "auto",
            tickFormat  = option.tickFormat || null,
            color       = option.color || "#222222",
            position    = option.position || 0,
            align       = option.align || "",
            scale       = option.scale || "linear",
            metric      = option.metric || null,
            domain      = option.domain || [0,1],
            range       = option.range || null,
            // padding     = {left: 0, right: 0, top: 0, bottom: 0},
            styles      = {stroke: color, 'stroke-width': 0.5},
            grid        = option.grid,
            format      = function(_){return _;},
            X = [],
            Y = [];


        if (range === null){
            range = (dim == "x") ? [0, width] : [0,height];
        }

        if (metric === null) {
            metric = new Metric().scale(scale).domain(domain).range(range);
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
            X[1] = metric.rangeLength();
        } else {
            if(!position && align) {
                position = [0, width/2, width];
                position = position[["left", "center", "right"].indexOf(align)];
            }
            X[0] = X[1] = position;
            Y[0] = 0;
            Y[1] = metric.rangeLength();
        }

        metric.show = metric.render = function() {

            axis.append("g")
                .append("line")
                .Attr({x1: X[0], x2: X[1], y1: Y[0], y2: Y[1], class: "axis"})
                .Style(styles);

            var di = (tickInterval == "auto") ? metric.domainIntervals(ticks) : metric.domainIntervals_fit(ticks);

            for(var i = 0; i < di.length; i++) {
                var x1,x2,y1,y2;
                if(dim == 'x'){
                    x1 = x2 = metric.value(di[i]);
                    y1 = position + tickPostion + tickLength / 2;
                    y2 = y1 - tickLength;
                } else {
                    y1 = y2 = metric.value(di[i]);
                    x1 = position + tickPostion + tickLength / 2;
                    x2 = x1 - tickLength;
                }
                // console.log(i, metric.value(i));
                var svgTicks = axis.append("g");
                svgTicks.append("line", {x1: x1, x2: x2, y1: y1, y2: y2, class: "tick"}, styles);

                var tickLabel = svgTicks.append("text")
                    .Attr({
                        x: x2 + labelPos.x,
                        y: y2 - labelPos.y,
                        class: "labels",
                        "font-size": ".9em",
                        "text-anchor": "middle"
                    });
                if(labelAngel) tickLabel.attr("transform", "rotate(" + [labelAngel, (x2 + labelPos.x), (y2 - labelPos.y)].join(",")+")");

                var labelText = (typeof(tickFormat) == "function") ? format(tickFormat(di[i])) : format(di[i]) ;
                tickLabel.appendChild( document.createTextNode(labelText) );

                styles["stroke-opacity"] = 0.7;

                if(grid) {
                    var gx1, gx2, gy1, gy2;
                    if(dim == 'x'){
                        gx1 = gx2 = metric.value(di[i]);
                        gy1 = 0;
                        gy2 =height;
                    } else {
                        gy1 = gy2 = metric.value(di[i]);
                        gx1 = 0;
                        gx2 = Math.max(range[0], range[1]);
                    }
                    axis.append("line", {x1: gx1, x2: gx2, y1: gy1, y2: gy2, class: "grid-lines"}, styles);
                }
            }
            axis.translate(padding.left, padding.top)

            return axis;
        };


        return metric;
    };


    return svg;

};