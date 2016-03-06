var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.i2v = {
    visualization   : require("./viz"),
    colors          : require("./colors"),
    metric          : require("./metric"),
    svg             : require("./svg/svg"),
    svgArc         : require("./svg/arc"),
    svgBar         : require('./svg/bar')


    // modules: {
    //     pie         : require("./svg/modules/pie"),
    //     alluvial    : require("./svg/module/alluvial.js")
    // }
};
