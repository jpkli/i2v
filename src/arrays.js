module.exports = new Arrays();

function Arrays() {
    "use strict;"
    function _reduce(array, opt) {
        var i,
            len = array.length,
            fn,
            result;

        switch (opt) {
            case "max":
                result = array.reduce(function(a, b) {
                    return (a > b) ? a : b;
                });
                break;
            case "min":
                result = array.reduce(function(a, b) {
                    return (a < b) ? a : b;
                });
                break;
            case "and":
            case "&":
                result = array.reduce(function(a, b) {
                    return a & b;
                });
                break;
            case "or":
            case "|":
                result = array.reduce(function(a, b) {
                    return a | b;
                });
                break;
            case "mult":
            case "*":
                result = array.reduce(function(a, b) {
                    return a * b;
                });
                break;
            default: // "sum" or "+"
                result = array.reduce(function(a, b) {
                    return a + b;
                });
                break;
        }

        return result;
    }

    this.reduce = function(opt) {
        return function(array) {
            var a = (array instanceof Array) ? array : Array.apply(null, arguments);
            return _reduce(a, opt);
        };
    };

    this.avg = function(array) {
        return _reduce(array, "+") / array.length;
        // return array.reduce(function(a,b){ return 0.5 * (a + b)});
    };

    this.normalize = function(array) {
        var max = _reduce(array, "max"),
            min = _reduce(array, "min"),
            range = max - min;

        return array.map(function(a){
            return (a - min) / range;
        });
    }

    this.seq = function(start, end, intv) {
        var interval = intv || 1,
            array = [];

        for(var i=start; i<=end; i+=interval)
            array.push(i);

        return array;
    };

    var that = this,
        fns = ["max", "min", "mult", "and", "or"];

    fns.forEach(function(f) {
        that[f] = that.reduce(f);
    });

    this.sum = this.reduce("+");

    this.scan = this.pfsum = function(a){
        var pfsum = [],
            accum = 0;

        for (var i = 0; i < a.length; i++) {
            accum += a[i];
            pfsum.push(accum);
        }

        return pfsum;
    };

    this.iscan = function(a) {
        return this.scan([0].concat(a));
    };

    this.diff = function(a, b) {
        var difference = [];
        a.forEach(function(d){
            if (b.indexOf(d)===-1) {
                difference.push(d);
            }
        });
        return difference;
    };

    this.intersect = function(a, b) {
        var t;
        if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
        return a.filter(function (e) {
                if (b.indexOf(e) !== -1) return true;
        });
    };

    this.unique = function(a) {
        return a.reduce(function(b, c) {
            if (b.indexOf(c) < 0) b.push(c);
            return b;
        }, []);
    };

    this.lcm = function(A) {
        var n = A.length, a = Math.abs(A[0]);
        for (var i = 1; i < n; i++) {
            var b = Math.abs(A[i]), c = a;
            while (a && b){ (a > b) ? a %= b : b %= a; }
            a = Math.abs(c*A[i])/(a+b);
        }
        return a;
    };

    this.stats = function(array){
        return {
            max: _reduce(array, "max"),
            min: _reduce(array, "min"),
            avg: this.avg(array)
        };
    };

    this.histogram = function(array, bins, _max, _min) {
        var l = array.length,
            min = (typeof(_min) == 'number') ? _min : _reduce(array, "min"),
            max = (typeof(_max) == 'number') ? _max : _reduce(array, "max"),
            range = max - min,
            interval = range / bins,
            hg = new Array(bins+1).fill(0);

        for(var i = 0; i < l; i++){
            hg[Math.floor( (array[i] - min) / range * (bins)) ]++;
        };

        hg[bins-1] += hg[bins];
        return hg.slice(0,bins);
    }

    this.var = function(array) {
        var m = _reduce(array, "+") / array.length,
            va = array.map(function(a){ return Math.pow(a-m, 2) });

        return _reduce(va, "+") / (array.length - 1);
    }

    this.std = function(array) {
        return Math.sqrt(that.var(array));
    }
}
