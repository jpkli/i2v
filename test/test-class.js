var Class = require('../src/class');

var c1 = Class.create(function(arg){
    var option = arg || {}
    this.$width = option.width || 100;
    this.$height = option.height || 100;
});

var c2 = c1.extend(function(arg){
    var option = arg || {};
    this.$padding = arg.padding;
    // console.log(this.$width, this.$height);
})


var c3 = c2.extend(function(a){
    this.$c = this.$width + this.$height;
    console.log(this.$padding, this.$c);
});


new c2({height:300, width: 500, padding: 100});
var o3 = new c3({height:300, width: 500, padding: 5000});

// console.log(o3._super._super._super._protected);
