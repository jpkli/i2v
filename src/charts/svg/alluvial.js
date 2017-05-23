
define(function(require) {
    "use strict";
    var Viz = require('../viz'),
        Colors = require("../colors"),
        ArrayOpt = require("p4/core/arrays");

    return Viz.extend(function Sankey(option){

        var option = option || {},
    		data =  option.data,
            width = option.width,
            height = option.height,
    		nodeWidth = option.nodeWidth || 0.2 * width / data.nodes.length || 20,
    		nodePadding = option.nodePadding || 10,
            format = function(d) { return d; },
    		color = option.color || Colors().set20a(),
            maxVals = [],
            showLegend = option.legend || false,
            size = option.size;

        var svg = this.$svg(),
            sankey = svg.append("g");

    	function makeNodes(){
    		var nodes = data.nodes,
    			stepTotal = nodes.length,
    			heightTotal = 0.9 * height,
    			paddingTotal = 0.1 * height,
    			nodePadding,
    			dy = 0,
    			dx = 0;

            if(typeof size == "undefined") {
                nodes[0].forEach(function(row, ri) {
                    maxVals[ri] = ArrayOpt.max(nodes.map(function(n){
                        if(n[ri])
                            return n[ri].count
                        else
                            return 0;
                    }));
                })

                size = ArrayOpt.sum(maxVals);
            }

    		for(var step = 0; step < stepTotal; step++){
    			nodePadding = paddingTotal / nodes[step].length;

    			dx = step * width / (stepTotal);
                dy = 0;
                var cValues = nodes[step].map(function(d){return d.count}),
                    totalSize = size;


                if(cValues.length > 0)
                    totalSize = ArrayOpt.sum(cValues);

                // console.log(totalSize, nodes[step]);

    			nodes[step].forEach(function(node, ni){
    				node.dx = nodeWidth;
    				node.dy = node.count  / size * heightTotal;
    				node.x = dx;
    				node.y = dy;
    				dy += node.count / totalSize * heightTotal + nodePadding;
                    // dy += (maxVals[ni] / size * heightTotal + nodePadding - node.dy) / 2;
    				node.outflow = [];
    				node.inflow = [];
    			});
    		}

    	}

    	function makeLinks(){
    		var links = data.links,
    			stepTotal = links.length,
    			nodes = data.nodes,
    			lid = 0;

    		for(var step = 0; step < stepTotal; step++){
    			if(nodes.length <= step+1) break;
    			links[step].forEach(function(link){
    				if(typeof link.source != 'undefined' && typeof link.target != 'undefined'){
    					link.source = nodes[step][link.source];
    					link.target = nodes[step+1][link.target];

    					link.dy = link.value / size * height * 0.9;
    					link.lid = lid++;
    					link.source.outflow.push(link);
    					link.target.inflow.push(link);
    				}
    			});
    		}

    		stepTotal = nodes.length;
    		for(var step = 0; step < stepTotal; step++){
    			nodes[step].forEach(function(node) {
    				var sy = 0, ty = 0;
    				node.outflow.forEach(function(link) {
    					link.sy = sy;
    					sy += link.dy;
    				});
    				node.inflow.forEach(function(link) {
    					link.ty = ty;
    					ty += link.dy;
    				});
    			});
    		}

    		stepTotal = links.length;
    		for(var step = 0; step < stepTotal; step++){
    			links[step].forEach(function(link){
    				link.path = computeLinkPath(link);
    			});
    		}
    	}

    	// function computeLinkPath(d) {
    	//   var xs  = d.source.x + d.source.dx*1.5,
        //       ys0 = d.source.y + d.sy,
        //       ys1 = d.source.y + d.sy + d.dy,
    	// 	  xt  = d.target.x - d.target.dx/2,
    	// 	  yt0 = d.target.y + d.ty,
    	// 	  yt1 = d.target.y + d.ty + d.dy;
        //
        //   return ["M"+xs, ys1,
        //          "L"+xs, ys0,
        //          "L"+xt, yt0,
        //          "L"+xt, yt1,"Z"].join(" ");
    	// }

        //
    	function computeLinkPath(d) {
    	  var curvature = 0.5,
    		  x0 = d.source.x + d.source.dx,
    		  x1 = d.target.x,
    		//   xi = d3.interpolateNumber(x0, x1),
              xi = function(c) { return x0 + (x1 - x0) * c },
    		  x2 = xi(curvature),
    		  x3 = xi(1 - curvature),
    		  y0 = d.source.y + d.sy + d.dy / 2,
    		  y1 = d.target.y + d.ty + d.dy / 2;

    	  return "M" + x0 + "," + y0
    		   + "C" + x2 + "," + y0
    		   + " " + x3 + "," + y1
    		   + " " + x1 + "," + y1;
    	}


    	function serialize(){
    		var nodes = [], links = [];
    		data.nodes.forEach(function(node){
    			nodes = nodes.concat(node);
    		});
    		data.links.forEach(function(link){
    			links = links.concat(link);
    		});
    		data = { nodes: nodes, links: links};
    		// console.log(data);
    	}

    	makeNodes();
    	makeLinks();
    	serialize();
    	// console.log(data);

    	this.configure = function(option){
    	  margin = option.margin || {top: 1, right: 1, bottom: 50, left: 1};
    	  width =  width - margin.left - margin.right;
    	  height = height - margin.top - margin.bottom;
    	}


    	this.reload = function(newData){
    		//console.log(data);
    		this.data = data = newData;
    		this.visualize();
    	};

    	this.visualize = function() {

            var sankeyLinks = sankey.append("g");

            data.links.forEach(function(d){
                if(d.value > 0) {
                    var link = sankeyLinks.append("path")
                        .attr("class", "link")
                        .attr("d", d.path)
                        .attr("stroke-width", d.dy)
                        .attr("stroke",  color(d.role));
                        // .sort(function(a, b) { return b.dy - a.dy; });

                    link.append("title")
            			.text(d.source.name + " → " + d.target.name + "\n(" + format(d.value) +")");
                }

            });

    		// link.filter(function(d){ return (d.source.area == d.target.area) || (d.source.area.indexOf('other')==0) ; })
            //
            //      .style("stroke", "#aaa");

            var sankeyNodes = sankey.append("g");
    		var node = sankeyNodes.append("g")
    			.attr("class", "node");

            data.nodes.forEach(function(d, i){
                node.append("rect")
                    .attr("x", d.x)
                    .attr("y", d.y)
                    .attr("height", Math.max(8, d.dy))
                    .attr("width", nodeWidth)
                    // .attr("class", "sankeyNode")
                    .attr("stroke", "#AAA")
                    // .attr("stroke-width",2)
                    .attr("fill", color(d.name))
                  .append("title")
                    .text(d.name + "\n" + format(d.count));

                // node.append("text")
                //     .attr("x", d.x)
                //     .attr("y", d.y + d.dy / 2)
                //     .attr("dy", ".35em")
                //     .css("font-size", 10)
                //     .text(d.name);
            })
    	}

        if(showLegend) {
            var names = {};

            this.data.nodes.forEach(function(node){
                node.forEach(function(n){
                    names[n.name] = 1;
                });
            });

            names = Object.keys(names);
            var that = this,
                legendHeight = height / names.length,
                legend = sankey.append("g");

            names.forEach(function(n, i){
                legend.append("rect")
                    .Attr({
                        x: width - 40,
                        y: i * legendHeight,
                        width: 20,
                        height: 20,
                        stroke: "#000",
                        fill:  color(n),
                    });
                legend.append("text")
                    .attr("x", width - 50)
                    .attr("y", i * legendHeight + 15)
                    .css("fill", "#222")
                    .css("text-anchor", "end")
                    .css("font-size", "0.9em")
                    .text(n);
            });
        }

        this.visualize();
        this.svg.push(svg);
        this.viz();
    });
});
