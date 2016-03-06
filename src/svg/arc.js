module.exports = function Arc(arg) {
    "use strict";

    var width = arg.width || 300,
        height = arg.height || width,
        center = arg.center || [width / 2, height/2],
        alpha1 = arg.radianStart || 0.000001,
        alpha2 = arg.radianEnd || 2 * Math.PI,
        r1 = arg.outerRadius || 10,
        r2 = arg.innerRadius || 0,
        arcSweep = (alpha2 - alpha1 <= Math.PI) ? "0" : "1",
        outerArcPath,
        innerArcPath;

    //Polar to Cartersian
    function p2c(r, d){
        return [
            center[0] + r*Math.cos(d),
            center[1] + r*Math.sin(d)
        ].join(" ");
    }

    outerArcPath = [
        "M", p2c(r1, alpha1),
        "A", r1, r1, 0, arcSweep, 1, p2c(r1, alpha2),
    ];

    if(r2){
        innerArcPath = [
            "L", p2c(r2, alpha2),
            "A",  r2, r2, 0, arcSweep, 0, p2c(r2, alpha1)
        ];
    } else {
        innerArcPath = ["L", center[0], center[1]];
    }
    innerArcPath.push("Z");

    return outerArcPath.concat(innerArcPath).join(" ");
};
