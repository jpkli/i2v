var Class = require("./class");

module.exports = Class.create(function Graphics(arg){
    "use strict";

    /* Private */
    var graphics = this,
        option = arg || {};

    /* Protected */
    graphics.$width = option.width || 400;
    graphics.$height = option.height || 300;
    graphics.$padding = {top: 0, bottom: 0, left: 0, right: 0};

    graphics.$autoAdjust = function(){};

    graphics.$indent = function(p) {
		graphics.$padding.top = p.top || 0;
		graphics.$padding.bottom = p.bottom || 0;
		graphics.$padding.left = p.left || 0;
		graphics.$padding.right = p.right || 0;
        graphics.$width -= (graphics.$padding.left + graphics.$padding.right);
        graphics.$height -= (graphics.$padding.top + graphics.$padding.bottom);
        graphics.$autoAdjust();
	};

    /* Public */
    this.data = option.data || {};

    this.init = function(){
        if(option.style) this.Style(option.style);
    };

    this.resize = function(w,h){
        graphics.$width = w - (graphics.$padding.left + graphics.$padding.right);
        graphics.$height = h - (graphics.$padding.top + graphics.$padding.bottom);
    };

    this.Style = function(style){
        for(var key in style){
            div.style[key] = style[key];
        }
        return this;
    };

    this.destroy = function() {
        this._super.destroy();
        div = null;
    };

    return graphics;
});
