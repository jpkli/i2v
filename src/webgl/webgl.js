module.exports = function WebGL(option){
    "use strict;"
    var webgl = {},
        arg = option || {},
        containerId = arg.container || "body";
        canvas = document.createElement("canvas"),
        width = arg.width || 400,
        height = arg.height || 300,
        padding = arg.padding || {left: 0, right: 0, top: 0, bottom: 0},
        attribute = arg.attribute || {},
        uniform = arg.uniform || {},
        varying = arg.varying || {},
        vertMain = function(){},
        fragMain = function(){},
        ctx = null,
        program = null,
        active = false;

    canvas.width = width - padding.left - padding.right;
    canvas.height = height - padding.top - padding.bottom;
    canvas.style.position = "absolute";
    canvas.style.left = padding.left + "px";
    canvas.style.top = padding.top + "px";

    ctx = setupWebGL(canvas);

    document.getElementById(containerId).appendChild(canvas);

    var uniformSetter = {
        boolean : ctx.uniform1i,
        int     : ctx.uniform1i,
        float   : ctx.uniform1fv,
        vec2    : ctx.uniform2fv,
        vec3    : ctx.uniform3fv,
        vec4    : ctx.uniform4fv,
        ivec2   : ctx.uniform2i,
        ivec3   : ctx.uniform3i,
        ivec4   : ctx.uniform4i
    }

    function setUniform(type, location, value) {
        switch(type) {
            case "float":
                ctx.uniform1f(location, value);
                break;
            case "vec2":
                ctx.uniform2fv(location, Float32Array.from(value));
                break;
            case "vec3":
                ctx.uniform3fv(location, Float32Array.from(value));
                break;
            case "vec4":
                ctx.uniform4fv(location, Float32Array.from(value));
                break;
            case "int":
                ctx.uniform1i(location, value);
                break;
            case "vec2i":
                ctx.uniform2iv(location, Int32Array.from(value));
                break;
            case "vec3i":
                ctx.uniform3iv(location, Int32Array.from(value));
                break;
            case "vec4i":
                ctx.uniform4iv(location, Int32Array.from(value));
                break;
            case "mat2":
                ctx.uniformMatrix2fv(location, Float32Array.from(value));
                break;
            case "mat3":
                ctx.uniformMatrix3fv(location, Float32Array.from(value));
                break;
            case "mat4":
                ctx.uniformMatrix4fv(location, Float32Array.from(value));
                break;
        }
    }

    function setupWebGL(canvas) {
        var names = ["webgl", "experimental-webgl"];
        var gl = null;
        for (var i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i]);
            } catch(e) {}
            if (gl) break;
        }
        return gl;
    }

    function setAttribute(name, value) {
        if(Array.isArray(value) || ArrayBuffer.isView(value)){
            var size = parseInt(attribute[name].type.slice(3,4)) || 1;
            attribute[name].location = ctx.getAttribLocation(program, name);
            attribute[name].buffer = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].buffer);
            ctx.enableVertexAttribArray(attribute[name].location);
            ctx.vertexAttribPointer(attribute[name].location, size, ctx.FLOAT, false, 0, 0);
            ctx.bufferData(ctx.ARRAY_BUFFER, value, ctx.STATIC_DRAW);
        }

    }

    webgl.attr = webgl.attribute = function(type, name, value) {
        attribute[name] = {type: type, value: value, location: null, buffer: null};

        Object.defineProperty(webgl.attribute, name, {
            get: function() { return attribute[name];},
            set: function(arrayBuffer) {
                setAttribute(name, arrayBuffer);
            }
        });

        return webgl;

    };

    webgl.unif = webgl.uniform = function(type, name, value) {
        uniform[name] = {type: type, value: value, location: null};

        Object.defineProperty(webgl.uniform, name, {
            get: function() { return uniform[name];},
            set: function(value) {
                uniform[name].location = ctx.getUniformLocation(program, name);
                uniform[name].value = value;
                setUniform(uniform[name].type, uniform[name].location, value);
            }
        });

        return webgl;
    };

    webgl.vary = webgl.varying = function(type, name) {
        varying[name] = {type: type, value: null, location: null};
        return webgl;
    };

    webgl.vertMain = function(f){
        vertMain = f;
        return webgl;
    }

    webgl.fragMain = function(f){
        fragMain = f;
        return webgl;
    }

    function toGLSL(src){
        return "void main() " + src.toString().replace(/function.+{/, '{').replace(/\$(.*?)\./g, "$1 ");
    }

    function compile(shaderSource, shaderType) {
        if (shaderType !== ctx.VERTEX_SHADER && shaderType !== ctx.FRAGMENT_SHADER) {
            throw ("Error: unknown shader type");
        }

        var _shader = ctx.createShader(shaderType);
        ctx.shaderSource(_shader, shaderSource);
        ctx.compileShader(_shader);

        // Check the compile status, get compile error if any
        var compiled = ctx.getShaderParameter(_shader, ctx.COMPILE_STATUS);
        if (!compiled) {
            var lastError = ctx.getShaderInfoLog(_shader);
            throw new Error("Error compiling shader '" + _shader + "':" + lastError);
            ctx.deleteShader(_shader);
            return null;
        }

        return _shader;
    }

    webgl.init = function(){
        var vertSrc = "precision mediump float;",
            fragSrc = "precision mediump float;";

        for(var a in attribute) {
            vertSrc += "attribute " + attribute[a].type + " " + a + ";";
        }
        for(var u in uniform){
            var line = "uniform " + uniform[u].type + " " + u + ";";
            vertSrc += line;
            fragSrc += line;
        }
        for(var v in varying){
            var line = "varying " + varying[v].type + " " + v + ";";
            vertSrc += line;
            fragSrc += line;
        }

        vertSrc += toGLSL(vertMain);
        fragSrc += toGLSL(fragMain);

        program = ctx.createProgram();
        ctx.attachShader(program, compile(vertSrc, ctx.VERTEX_SHADER));
        ctx.attachShader(program, compile(fragSrc, ctx.FRAGMENT_SHADER));
        ctx.linkProgram(program);
        var linked = ctx.getProgramParameter(program, ctx.LINK_STATUS);
        if (!linked) {
            var lastError = ctx.getProgramInfoLog(program);
            throw ("Error in program linking:" + lastError);
            ctx.deleteProgram(program);
            return null;
        }
        ctx.useProgram(program);
        for(var ai in attribute) {
            if(attribute[ai].value)
                setAttribute(ai, attribute[ai].value);
        }
        for(var ui in uniform){
            if(uniform[ui].value) {
                uniform[ui].location = ctx.getUniformLocation(program, ui);
                setUniform(uniform[ui].type, uniform[ui].location, uniform[ui].value);
            }
        }

        return ctx;
    }

    webgl.test = function(){
        return uniform;
    }

    return webgl;
}
