var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.i2v = {};
root.module = {};

function require(url){
    // var scriptPath = "../src/"
    //     parts = url.split('/'),
    //     dep = parts[parts.length-1];
    //     script = document.createElement("script");
    //
    // script.src = scriptPath + dep;
    // script.charset="utf-8";
    // document.head.appendChild(script);
    console.log("require dep", url);
};

Object.defineProperty(module, "exports", {
    set: function(fn) {
        if(fn.name) {
            root.i2v[fn.name] = fn;
            console.log("load", fn.name);
        } else {
            console.log(fn);
            throw ("*** Error: no function name found in module");
        }
    }
})
