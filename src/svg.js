if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require) {
    "use strict";
    return function Svg(arg){
        "use strict;"
        var svgNS = "http://www.w3.org/2000/svg",
            svg = document.createElementNS(svgNS, 'svg'),
            option = arg || {},
            width = option.width || 400,
            height = option.height || 300,
            container = option.container || null,
            style = option.style || {},
            padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0};

        // width -= padding.left + padding.right;
        // height -= padding.top + padding.bottom;

        var defaultAttr = {
            width   : width + padding.left + padding.right,
            height  : height + padding.top + padding.bottom,
            viewBox : [0, 0, width + padding.left + padding.right , height + padding.top + padding.bottom].join(" "),
            preserveAspectRatio: "none"
        };

        setAttr(svg, defaultAttr);
        if(style) setStyle(style);

        if(container) {
            container = (typeof(container) == "string") ? document.getElementById(container) : container;
            container.appendChild(svg);
        }

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
            obj.parentSVG = parent;
            obj.append = function(type, attr, style){
                return append(obj, type, attr, style);
            };

            obj.attr = function(a, v){
                // if(typeof(v)=="undefined") return obj.getAttribute(a);
                obj.setAttribute(a, v);
                return obj;
            };


            obj.css = function(a, v){
                // if(typeof(v)=="undefined") return obj.getAttribute(a);
                obj.style[a] = v;
                return obj;
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

            // obj.rotate = function(a, x, y) {
            //     var p = obj.getAttribute("transform") || "";
            //     obj.setAttribute("transform", p + "rotate(" + [a,x,y].join(",") + ") ");
            //     return obj;
            // };

            obj.scale = function(x, y) {
                var p = obj.getAttribute("transform") || "";
                obj.setAttribute("transform", p + "scale(" + [x,y].join(",") + ") ");
                return obj;
            };

            obj.remove = function(){
                obj.parentSVG.removeChild(obj);
            }

            obj.render = function(vmap) {
                var mappings = Object.keys(vmap).filter(function(k){return (k != "mark" || k != "data");});

                var setFunction = {};

                mappings.forEach(function(m){
                    if(typeof(vmap[m]) === "function") {
                        setFunction[m] = vmap[m];
                    } else if(typeof(vmap[m]) === "string" && vmap[m][0] == "@") {
                        setFunction[m] = function(d) { return d[vmap[m].slice(1)]; };
                    } else {
                        setFunction[m] = function() { return vmap[m]; };
                    }
                });

                function render(data){
                    data.forEach(function(d, di){
                        var mark = obj.append(vmap.mark);
                        mappings.forEach(function(m){
                            mark.attr(m, setFunction[m](d, di));
                        });
                    });
                };


                return render;
            }

            return obj;
        }

        svg.append = function(type, attr, style) {
            return append(svg, type, attr, style);
        }

        svg.innerWidth = function() {
            return width;
        }

        svg.innerHeight = function() {
            return height;
        }

        svg.padding = function() {
            return padding;
        }

        return svg;
    };
});
