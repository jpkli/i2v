function WebGL(option){
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
        texture = arg.texture || {},
        framebuffer = arg.framebuff || {},
        vertMain = function(){},
        fragMain = function(){},
        ctx = null,
        program = null,
        active = false;

    canvas.width = width - padding.left - padding.right;
    canvas.height = height - padding.top - padding.bottom;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid #000";
    canvas.style.left = padding.left + "px";
    canvas.style.top = padding.top + "px";

    ctx = setupWebGL(canvas);
    ctx.getExtension("OES_texture_float");
    ctx.getExtension("OES_texture_float_linear");

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

    function setAttribute(name, value) {
        if(Array.isArray(value) || ArrayBuffer.isView(value)){
            ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].ptr);
            if(attribute[name].value != value){
                // console.log("set attribute buffer");
                ctx.bufferData(ctx.ARRAY_BUFFER, value, ctx.STATIC_DRAW);
                attribute[name].value = value;
            }

        }
    }

    function linkAttribute(name) {
        var size = parseInt(attribute[name].type.slice(3,4)) || 1;
        // ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].ptr);
        attribute[name].location = ctx.getAttribLocation(program, name);
        ctx.vertexAttribPointer(attribute[name].location, size, ctx.FLOAT, false, 0, 0);
        ctx.enableVertexAttribArray(attribute[name].location);
    }

    function setTexture(name, tex){
        if(Array.isArray(tex) || ArrayBuffer.isView(tex)){
            // if(tex instanceof Float32Array != true)
            //     tex = new Float32Array(tex);

            ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
            ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.ALPHA, texture[name].dim[0], texture[name].dim[1], 0, ctx.ALPHA, ctx.FLOAT, tex);
            texture[name].value = tex;
            // ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
            // ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
            ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
            ctx.bindTexture(ctx.TEXTURE_2D, null);
        }
    }

    webgl.attribute = function(type, name, value) {
        attribute[name] = {type: type, value: null, location: null, ptr: ctx.createBuffer()};

        setAttribute(name, value);

        Object.defineProperty(webgl.attribute, name, {
            get: function() { return attribute[name];},
            set: function(arrayBuffer) {
                setAttribute(name, arrayBuffer);
            }
        });

        return webgl;
    };

    webgl.uniform = function(type, name, value) {
        uniform[name] = {type: type, value: value, location: null};

        Object.defineProperty(webgl.uniform, name, {
            get: function() { return uniform[name]; },
            set: function(value) {
                uniform[name].location = ctx.getUniformLocation(program, name);
                uniform[name].value = value;
                setUniform(uniform[name].type, uniform[name].location, value);
            }
        });

        return webgl;
    };

    webgl.varying = function(type, name) {
        varying[name] = {type: type, value: null, location: null};
        return webgl;
    };

    webgl.texture = function(type, name, value, dim){
        texture[name] = {type: type, value: null, location: null, ptr: ctx.createTexture(), dim: dim};
        setTexture(name, value);
        Object.defineProperty(webgl.texture, name, {
            get: function() { return texture[name];},
            set: function(texArray) {
                setTexture(name, texArray);
            }
        });

        return webgl;
    }

    webgl.framebuffer = function(name, w, h) {
        // framebuffer[name] = {width: w, height: h, ptr: ctx.createFrameBuffer()};
        framebuffer[name] = ctx.createFrameBuffer();
        framebuffer[name].width = w || 1024;
        framebuffer[name].height = h || 1024;

        ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer[name]);

        texture[name] = {
            ptr: ctx.createTexture(),
            dim: [framebuffer[name].width,framebuffer[name].height],
            type: type,
            value: null,
            location: null
        };

        ctx.bindTexture(ctx.TEXTURE_2D, rttTexture);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR_MIPMAP_NEAREST);
        ctx.generateMipmap(gl.TEXTURE_2D);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, framebuffer[name].width, framebuffer[name].height, 0, ctx.RGBA, ctx.UNSIGNED_BYTE, null);

        var renderbuffer = ctx.createRenderbuffer();
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderbuffer);
        ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

        ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D, rttTexture, 0);
        ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, renderbuffer);

        ctx.bindTexture(ctx.TEXTURE_2D, null);
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
    }

    webgl.vertMain = function(f){
        vertMain = f;
        return webgl;
    }

    webgl.fragMain = function(f){
        fragMain = f;
        return webgl;
    }

    webgl.shader = function(arg){
        var shader = {},
            option = arg || {},
            shaderType = option.type || null,
            deps = option.require || [],
            env = option.env || {},
            fbo = option.fbo || {},
            shaderFunction = option.function ||  {};

        shader.vertex = function() {
            shaderType = ctx.VERTEX_SHADER;
            return shader;
        }

        shader.fragment = function() {
            shaderType = ctx.FRAGMENT_SHADER;
            return shader;
        }

        shader.require = function(d) {
            if(Array.isArray(deps)) deps = d;
            else deps = [d];
            return shader;
        }

        shader.function = function(type, name, fn){
            shaderFunction[name] = {type: type, fn: fn};
            return shader;
        }

        shader.env = function(pairs) {
            Object.keys(pairs).forEach(function(k){
                env[k] = pairs[k] ;
            });
            return shader;
        }

        shader.framebuffer = function(name, w, h){
            if(!(name in framebuffer))
                webgl.framebuffer(name, w, h);
            else
                fbo = framebuffer[name];
        }

        shader.init = function() {
            var shaderSource = "precision highp float;\n";

            deps.forEach(function(dep){
                if(attribute.hasOwnProperty(dep)) {
                    shaderSource += "attribute " + attribute[dep].type + " " + dep + ";\n";
                } else if(uniform.hasOwnProperty(dep)) {
                    shaderSource += "uniform " + uniform[dep].type + " " + dep + ";\n";
                } else if(texture.hasOwnProperty(dep)) {
                    shaderSource += "uniform " + texture[dep].type + " " + dep + ";\n";
                } else if(varying.hasOwnProperty(dep)) {
                    shaderSource += "varying " + varying[dep].type + " " + dep + ";\n";
                }
            });

            for(var f in shaderFunction) {
                shaderSource += toGLSL(shaderFunction[f].type, f, shaderFunction[f].fn, env);
            }

            console.log(shaderSource, env);

            var _shader = compile(shaderType, shaderSource);
            _shader._shaderType = shaderType;
            return _shader;
        }

        return shader;
    }

    function applyEnvParameters(str, mapping){
        //find all $(...) and replace them with env params in mapping
        var re = new RegExp("\\$\\(("+Object.keys(mapping).join("|")+")\\)","g");
        return str.replace(re, function(matched){
            return mapping[matched.slice(2,matched.length-1)];
        });
    }

    function toGLSL(returnType, name, fn, mapping){
        var glsl = fn.toString();
        if(mapping) glsl = applyEnvParameters(glsl,  mapping);
        return returnType + " " +
            name + "(" + glsl
            .replace(/\$(.*?)\./g, "$1 ")
            .replace(/function.+\((.*?){/, '$1{') + "\n";
    }

    function compile(shaderType, shaderSource) {
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

    webgl.program = function(shaders) {
        program = ctx.createProgram();
        ctx.attachShader(program, shaders[0]);
        ctx.attachShader(program, shaders[1]);
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
                linkAttribute(ai);
                // setAttribute(ai, attribute[ai].value);
        }

        for(var ui in uniform){
            if(uniform[ui].value) {
                uniform[ui].location = ctx.getUniformLocation(program, ui);
                setUniform(uniform[ui].type, uniform[ui].location, uniform[ui].value);
            }
        }

        Object.keys(texture).forEach(function(t, i){
            if(texture[t].value) {
                // setTexture(t, texture[t].value);
                ctx.activeTexture(ctx.TEXTURE0 + i);
                ctx.bindTexture(ctx.TEXTURE_2D, texture[t].ptr);
                texture[t].location = ctx.getUniformLocation(program, t);
                ctx.uniform1i(texture[t].location, i);
            }
        });

        return ctx;
    }

    webgl.init = function(){
        var vertSrc = "precision highp float;",
            fragSrc = "precision highp float;";

        for(var a in attribute) {
            vertSrc += "attribute " + attribute[a].type + " " + a + ";";
        }
        for(var u in uniform){
            var line = "uniform " + uniform[u].type + " " + u + ";";
            vertSrc += line;
            fragSrc += line;
        }

        for(var t in texture){
            var line = "uniform " + texture[t].type + " " + t + ";";
            vertSrc += line;
            fragSrc += line;
        }
        for(var v in varying){
            var line = "varying " + varying[v].type + " " + v + ";";
            vertSrc += line;
            fragSrc += line;
        }

        vertSrc += toGLSL("void", "main", vertMain);
        fragSrc += toGLSL("void", "main", fragMain);

        // console.log(vertSrc, fragSrc);

        webgl.program([compile(ctx.VERTEX_SHADER, vertSrc), compile(ctx.FRAGMENT_SHADER, fragSrc)]);

        return ctx;
    }

    return webgl;
}
