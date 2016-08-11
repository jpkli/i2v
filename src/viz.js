if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    var Class = require("./class"),
        Svg = require('./svg/svg');

    return Class.create(function Viz(arg){
        "use strict";

        /* Private */
        var viz = this,
            option = arg || {},
            containerId = option.container || "body",
            container;

        /* Protected */
        this.$width = option.width || 400;
        this.$height = option.height || 300;
        this.$padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0};
        this.$domain = option.domain;


        this.$width -= (this.$padding.left + this.$padding.right);
        this.$height -= (this.$padding.top + this.$padding.bottom);

        this.$svg = function(arg) {
            var arg = arg || {},
                width = arg.width || this.$width,
                height = arg.height || this.$height,
                padding = arg.padding || this.$padding;

            return Svg.call(this, {
                width: width,
                height: height,
                padding: padding,
            });
        }
        /* Public */
        this.data = option.data || [];
        this.div = document.createElement("div");
        this.svg = [];
        this.webgl = [];

        this.init = function(){
            container = (containerId == "body") ? document.body : document.getElementById(containerId);

            this.div.className = option.className || "i2v-viz";
            this.resize(
                this.$width + this.$padding.left + this.$padding.right,
                this.$height + this.$padding.top + this.$padding.bottom
            );

            if(option.style) this.css(option.style);

            container.appendChild(this.div);

            return viz;
        };

        this.viz = function() {
            viz.webgl.forEach(function(g){
                viz.div.appendChild(g);
            })
            viz.svg.forEach(function(g){
                viz.div.appendChild(g);
            });
        }

        this.css = function(style){
            for(var key in style){
                this.div.style[key] = style[key];
            }
            return this;
        };

        this.resize = function(w,h){
            this.div.style.width = w + "px";
            this.div.style.height = h + "px";
        };

        this.append = function(m) {
            if(m.tagName == "svg") this.svg.push(m);
            if(m.tagName == "canvas") this.webgl.push(m)
        }

        this.prepend = function(m) {
            if(m.tagName == "svg") this.svg = [m].concat(this.svg);
            if(m.tagName == "canvas") this.webgl = [m].concat(this.webgl);
        }

        this.destroy = function() {
            this._super.destroy();
            container.removeChild(this.div);
            div = null;
        };

        return viz.init();
    });
})
