var Svg = require('./svg.js');

module.exports = Svg.extend(function Selector(arg){
    "use restrict";

    var $this = this._protected,
		option = arg || {},
        width = arg.width || $this.width,
        height = arg.height || $this.height,
        container = arg.container ||  $this.svg.main,
        offset = {x: 50, y: 50};


    var base = container.append("g")
                .attr("class", "selector");

    base.append("rect")
        .attr("class", "selector-base")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill-opacity", 0)
        .attr("stroke", "none")
        .css("cursor", "crosshair");

    var selector = base.append("rect")
        .attr("class", "selector-controller")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", 0)
        .attr("fill-opacity", 0.2)
        .css("fill", "#aaa")
        .css("stroke", "#FFFFFF")
        .css("cursor", "move");

    var sx, sy, dx, dy, intStart = false, drag = false, tx=0, ty=0;

    base.addEventListener("mousedown", function(evt){
        evt.preventDefault();

        intStart = true;
        sx = evt.clientX;
        sy = evt.clientY;

        var sp = selector.getBoundingClientRect();

        function isSelect(x, y) {

            return ;
        }

        if(sx>sp.left && sy>sp.top && sx<sp.left+sp.width && sy<sp.top+sp.height) drag = true;

        if(!drag){
            tx=0;
            ty=0;
            selector.attr("x", sx-offset.x)
                .attr("y", sy-offset.y)
                .attr("width", 0)
                .attr("height", 0).attr("transform", "translate(0,0)");
        }

        ondrag = function(evt){
            if(intStart){
                dx = evt.clientX - sx;
                dy = evt.clientY - sy;

                if(drag){
                    selector.attr("transform", "translate(" + (dx + tx) + " , " + (dy + ty) + ")");
                    // selector.attr("x", sx + dx - offset.x ).attr("y", sy + dy - offset.y );

                } else {

                    selector.attr("width", Math.abs(dx)).attr("height", Math.abs(dy));

                    // if(dy<0 && dx>=0) selector.attr("transform", "translate(0," + dy + ")");
                    // if(dx<0 && dy>=0) selector.attr("transform", "translate(" + dx + " ,0)");
                    // if(dx<0 && dy<0) selector.attr("transform", "translate(" + dx + " , " + dy + ")");

                    if(dy<0 && dx>=0) selector.attr("y", sy+dy-offset.y );
                    if(dx<0 && dy>=0) selector.attr("x", sx+dx-offset.x );
                    if(dx<0 && dy<0) selector.attr("x", sx+dx-offset.x ).attr("y", sy+dy-offset.y );

                }

                if(evt.clientX >= width ||
                    evt.clientY >= height ||
                    evt.clientX <= offset.x ||
                    evt.clientY <= offset.y)

                    base.dispatchEvent(new Event("mouseup"));
            }

        };


        base.addEventListener("mousemove", ondrag, false);

        base.addEventListener("mouseup", function(evt){
            if(intStart){
                intStart = false;
                if(drag){
                    // selector.attr("x", sp.left + dx - offset.x)
                    //     .attr("y", sp.top + dy - offset.y).attr("transform", "translate(0,0)");
                    tx += dx;
                    ty += dy;
                    drag = false;
                }

            }
            base.removeEventListener("mousemove", ondrag, false);
        });

    });



});
