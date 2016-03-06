module.exports = function Shader(option){
    "use strict;"
    var shader = {},
        arg = option || {},
        ctx = arg.context || arg.ctx || null,
        program = null,
        active = false,
        attribute = arg.attribute || {},
        uniform = arg.uniform || {},
        varying = arg.varying || {},
        buffer = arg.buffer || [],
        vertMain = function(){},
        fragMain = function(){};

    if(!ctx) throw ("Error: no gl context given for creating shaders!");

    var setUniform = {
        boolean : ctx.uniform1i,
        int     : ctx.uniform1i,
        float   : ctx.uniform1f,
        vec2    : ctx.uniform2f,
        vec3    : ctx.uniform3f,
        vec4    : ctx.uniform4f,
        ivec2   : ctx.uniform2i,
        ivec3   : ctx.uniform3i,
        ivec4   : ctx.uniform4i
    }

    shader.attr = shader.attribute = function(type, name) {
        attribute[name] = {type: type, value: null, location: null, buffer: null};
        return shader;
    };

    shader.unif = shader.uniform = function(type, name) {
        uniform[name] = {type: type, value: null, location: null};
        return shader;
    };

    shader.vary = shader.varying = function(type, name) {
        varying[name] = {type: type, value: null, location: null};
        return shader;
    };

    Object.defineProperty(shader.attribute, name, {
        get: function() { return attribute[name];},
        set: function(arrayBuffer) {
            var size = parseInt(attribute[name].type.slice(3,4)) || 1;
            attribute[name].location = ctx.getAttribLocation(program, name);
            attribute[name].buffer = ctx.createBuffer();
            ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].buffer);
            ctx.enableVertexAttribArray(attribute[name].location);
            ctx.vertexAttribPointer(attribute[name].location, size, ctx.FLOAT, false, 0, 0);
            ctx.bufferData(ctx.ARRAY_BUFFER, arrayBuffer, ctx.STATIC_DRAW);
        }
    });

    Object.defineProperty(shader.uniform, name, {
        get: function() { return uniform[name];},
        set: function(value) {
            uniform[name].location = ctx.getUniformLocation(program, name);
            uniform[name].value = value;
            setUniform[uniform[name].type].apply(null, [uniform[name].location].concat(value));
        }
    })

    shader.vertMain = function(f){
        vertMain = f;
        return shader;
    }

    shader.fragMain = function(f){
        fragMain = f;
        return shader;
    }

    function toGLSL(src){
        return "void main() " + src.toString().replace(/function.+{/, '{').replace(/\$(.*?)\./g, "$1 ");
    }

    function compile(shaderSource, shaderType) {
        if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
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

    shader.init = function(){
        var vertSrc = "",
            fragSrc = "";

        for(var a in attribute) {
            vertSrc += "attribute " + attribute[a].type + " " + a + ";\n";
        }
        for(var u in uniform){
            var line = "uniform " + uniform[a].type + " " + u + ";\n";
            vertSrc += line;
            fragSrc += line;
        }
        for(var v in varying){
            var line = "varying " + varying[v].type + " " + v + ";\n";
            vertSrc += line;
            fragSrc += line;
        }

        vertSrc += toGLSL(vertMain);
        fragSrc += toGLSL(fragMain);

        // console.log([vertSrc, fragSrc]);

        var program = ctx.createProgram();
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
        return program;
    }

    function createShaderFromScript(scriptId) {
        var shaderSource = "";
        var shaderType;
        var shaderScript = document.getElementById(scriptId);
        if (!shaderScript) {
            throw ("Error: unknown script element" + scriptId);
        }
        shaderSource = shaderScript.text;

        if (shaderScript.type === "x-shader/x-vertex") {
            shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript.type === "x-shader/x-fragment") {
            shaderType = gl.FRAGMENT_SHADER;
        } else if (shaderType !== gl.VERTEX_SHADER && shaderType !== gl.FRAGMENT_SHADER) {
            throw ("Error: unknown shader type");
        }

        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);

        // Check the compile status, get compile error if any
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var lastError = gl.getShaderInfoLog(shader);
            throw new Error("Error compiling shader '" + shader + "':" + lastError);
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function createProgramFromScripts(shaderScriptIds) {
        var shaders = [];
        for (var ii = 0; ii < shaderScriptIds.length; ++ii) {
            shaders.push(createShaderFromScript(shaderScriptIds[ii]));
        }
        var program = gl.createProgram();
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });

        gl.linkProgram(program);

        // Check for link status and get error if any
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            var lastError = gl.getProgramInfoLog(program);
            throw ("Error in program linking:" + lastError);
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }


    return shader;
}
