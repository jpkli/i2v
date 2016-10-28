if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    function linearInterpolate(domain, range) {
        return function(v) {
            return range[0] + (v - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]);
        };
    }

    return function Metric(arg) {
        var metric =  map(),
            option = arg || {},
            align = option.align || 'center',
            scale = option.scale || 'linear',
            domain = option.domain || [0,1],
            margin = option.margin || 0,
            range = option.range || [0,1];

        function map() {
            return (function(v) { return metric.value(v); });
        }

        if(typeof(Math.log10) === 'undefined')
            Math.log10 = function(_) { return Math.log(_) / Math.log(10); };

        metric.map = map;

        metric.scale = function(s) {
            if(arguments.length){
                scale = s;
                return metric;
            } else {
                return scale;
            }
        };

        metric.domain = function(d) {
            if(arguments.length) {
                domain = d;
                return metric;
            } else {
                return domain;
            }
        };

        metric.range = function(r) {
            if(arguments.length){
                range = r;
                return metric;
            } else {
                return range;
            }
        };

        metric.value = function(v) {
            if(scale == "linear") {
                return range[0] + (v - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]);
            } else if(scale == "ordinal" || scale == "categorical") {
                var offset = (align == 'center') ? 0.5 : 1.0,
                    res = range[0] + (domain.indexOf(v)+offset) / domain.length * (range[1] - range[0]);
                return res;
            }
        };

        metric.interval = function() {
            if (scale == "ordinal" || scale == "categorical")
                return (1 / domain.length * Math.abs(range[1] - range[0]));
        };

        metric.intervalBand = function(m) {
            if(typeof(m) !== "undefined") {
                margin = m;
                return metric;
            } else {
                return (1-margin) * metric.interval();
            }
        };

        metric.tickInterval = function(ticks) {
            var s = Math.pow(10, Math.floor(Math.log10(Math.abs(range[1] - range[0])))-1);
            return Math.floor( Math.abs(range[1] - range[0]) / (ticks * s) )  * s;
        };

        metric.domainIntervals = function(tick) {
            var intervals = [];
            if(scale == "linear") {
                var s = Math.pow(10, Math.floor(Math.log10(Math.abs(domain[1] - domain[0])))-1),
                    dist = Math.floor( (domain[1] - domain[0]) / (tick * s) )  * s,
                    step = Math.abs(dist),
                    start = Math.min(domain[0], domain[1]) + step,
                    end = Math.max(domain[0], domain[1]);

                for(var i = start, k=1; i< end; i+=step) {
                    intervals.push(domain[0]+k*dist);
                    k++;
                }
                return intervals;
            } else if(scale == "ordinal" || scale == "categorical") {
                return domain;
            }
        };

        metric.domainIntervals_fit = function(tick) {
            var intervals = [];
            if(scale == "linear") {
                var step = Math.abs(domain[1] - domain[0]) / tick;

                for(var i = domain[0]; i<=domain[1]; i+=step) {
                    intervals.push(i);
                }
                return intervals;
            } else if(scale == "ordinal" || scale == "categorical") {
                return domain;
            }
        };

        metric.domainLength = function() {
            if(scale == "linear")
                return Math.abs(domain[1] - domain[0]);
            else if(scale == "ordinal" || scale == "categorical")
                return domain.length;
        };

        metric.rangeLength = function() {
            return Math.abs(range[1] - range[0]);
        };

        metric.invert = function(r) {
            if(scale == "linear") {
                return domain[0] + (r - range[0]) / (range[1] - range[0]) * (domain[1] - domain[0]);
            } else if(scale == "ordinal" || scale == "categorical") {

                return r;
            }
        }

        return metric;
    };
});
