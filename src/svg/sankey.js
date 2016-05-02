var Svg = require("../svg.js"),
    Colors = require("..colors.js"),
    ArrayOpt = require("../arrays.js")

module.exports = function Sankey(option){
    "use restrict";

    var option = option || {},
		data =  option.data,
        width = option.width,
        height = option.height,
		nodeWidth = option.nodeWidth || 30,
		nodePadding = option.nodePadding || 10,
        format = function(d) { return d; },
		color = Colors().set20a(),
        maxVals = [],
        size;

	function makeNodes(){
		var nodes = data.nodes,
			stepTotal = nodes.length,
			heightTotal = 0.8 * height,
			paddingTotal = 0.2 * height,
			nodePadding,
			dy = 0,
			dx = 0;

        nodes[0].forEach(function(row, ri) {
            maxVals[ri] = ArrayOpt.max(nodes.map(function(n){
                if(n[ri])
                    return n[ri].count
                else
                    return 0;
            }));
        })

        size = ArrayOpt.sum(maxVals);

		for(var step = 0; step < stepTotal; step++){
			nodePadding = paddingTotal / nodes[step].length;

			dx = step * width / stepTotal;
            dy = 0;
			nodes[step].forEach(function(node, ni){
				node.dx = nodeWidth;
				node.dy = node.count  / size * heightTotal;
				node.x = dx;
				node.y = dy;
				dy += maxVals[ni] / size * heightTotal + nodePadding;
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

					link.dy = link.value / size * height * 0.8;
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

        var sankeyLinks = svg.append("g");

        data.links.forEach(function(d){
            var link = sankeyLinks.append("path")
                .attr("class", "link")
                .attr("d", d.path)
                .attr("stroke-width", d.dy)
                .attr("stroke",  color(d.role));
                // .sort(function(a, b) { return b.dy - a.dy; });

            link.append("title")
    			.text(function(d) { return d.source.area + " → " + d.target.area + "\n(" + format(d.value) +")"; });

        });

		// link.filter(function(d){ return (d.source.area == d.target.area) || (d.source.area.indexOf('other')==0) ; })
        //
        //      .style("stroke", "#aaa");

        var sankeyNodes = Svg.append("g");
		var node = sankeyNodes.append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        data.nodes.forEach(function(d){
            node.append("rect")
                .attr("height", d.dy)
                .attr("width", nodeWidth)
                .attr("class", "sankeyNode")
                .attr("fill", "#AAA" )
                //.style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
              .append("title")
                .text(function(d) { return d.area + "\n" + format(d.count); });

            node.append("text")
                .attr("x", 0)
                .attr("y", d.dy / 2)
                .attr("dy", ".35em")
                // .attr("text-anchor", "end")
                .attr("transform", null)
                .css("font-size", 10);
        })

		//   .filter( function(d) { return d.x < width / 2; })
		// 	.attr("x", - nodeWidth)
		// 	.attr("text-anchor", "start");
	}

	this.initialize();
};
