module.exports = (function(){

    var root            = this,
        debug           = true,
        registry        = {},
        $protected      = {},
        base = (function(){
            var $objId = 101,
                classBase = function(){
                    $protected[$objId] = {};
                    this.objId = $objId;
                    this._protected = function(){ return $protected[$objId]; };
                    this.destroy = function(){ delete $protected[this.objId]; };
                    $objId++;
                };
            return classBase;
        }());

    if(!Object.create){
        Object.create = function createObject(proto) {
            function ctor() { }
            ctor.prototype = proto;
            return new ctor();
        };
    }

    function create(classFunction){
        return extend(base, classFunction);
    }

    function _polymorph(childFunction, parentFunction) {
        return function () {
            var output;
            this.__super = parentFunction;
            output = childFunction.apply(this, arguments);
            delete this.__super;
            return output;
        };
    }

    function extend(classBase, classFunction){
        function classX(option){
            this._super = {};
            classBase.call(this._super, option);
            this._protected = _protected(this._super);

            for(var key in this._protected){
                if(!this.hasOwnProperty(key)){
                    this[key] = this._protected[key];
                }
            }

            for(var key in this._super){
                if(!this.hasOwnProperty(key)){
                    this[key] = this._super[key];
                }
                if(key[0] == "$") $protected[this.objId][key] = this._super[key];
            }

            classFunction.call(this, option);

            for(var key in this){
                if(key[0] == "$") $protected[this.objId][key] = this[key];
            }

            //prevent accessing protected variables from outside
            delete this._protected;
            for(var key in this){
                if(key[0] == "$"){
                    delete this[key];
                }
            }

            return this;
        }

        if(classFunction.name)
            classX = rename(classX, classFunction.name);

        classX.prototype = Object.create(classBase.prototype);
        classX.prototype.constructor = classX;
        classX.extend = function(classFunction){
            return extend(classX, classFunction);
        };

        return classX;
    }

    function rename(classFunction, newClassName){
        var f = (new Function("return function(classX) { return function " + newClassName + "() { return classX(this, arguments) }; };")());
        return f(Function.apply.bind(classFunction));
    }

    function _protected(obj){
        return $protected[obj.objId];
    }

    var NewClass = {
        create: create,
        extend: extend,
        rename: rename
    };

    if(debug){
        NewClass._protectedSpace = $protected;
    }

    return NewClass;

}());
