define(function(){
    return function WebGL(option){
    "use strict;"
    var webgl = {},
        arg = option || {},
        containerId = arg.container || "body";
        canvas = arg.canvas || document.createElement("canvas"),
        width = arg.width || 400,
        height = arg.height || 300,
        padding = arg.padding || {left: 0, right: 0, top: 0, bottom: 0},
        attribute = arg.attribute || {},
        uniform = arg.uniform || {},
        varying = arg.varying || {},
        texture = arg.texture || {},
        framebuffer = arg.framebuffer || {},
        vertMain = function(){},
        fragMain = function(){},
        ctx = null,
        kernels = {},
        shaders = {vertex: {}, fragment: {}},
        program = null,
        env = arg.env || {},
        sharedFunction = option.sharedFunction ||  {},
        active = false;

    if(typeof(canvas) == "string") {
        if(canvas[0] == "#") canvas = document.getElementById(cavnas.substring(1));
        else canvas = document.getElementById(cavnas);
    }

    canvas.width = width - padding.left - padding.right;
    canvas.height = height - padding.top - padding.bottom;
    // canvas.style.position = "absolute";
    // canvas.style.border = "1px solid #000";
    canvas.style.marginLeft = padding.left + "px";
    canvas.style.marginTop = padding.top + "px";

    ctx = setupWebGL(canvas);
    webgl.ctx = ctx;
    webgl.canvas = canvas;
    // var ext = (
    //   ctx.getExtension("WEBGL_compressed_texture_s3tc") ||
    //   ctx.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
    //   ctx.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc")
    // );
    // ctx.getExtension("OES_texture_float");
    // ctx.getExtension("OES_texture_float_linear");
    // ext = ctx.getExtension("EXT_blend_minmax");
    ctx.ext = {};
    enableExtension([
        "OES_texture_float",
        "OES_texture_float_linear",
        // "EXT_blend_minmax"
    ]);

    // var blendExt = ctx.getExtension("EXT_blend_minmax");
    // ctx.MAX_EXT = blendExt.MAX_EXT;
    // ctx.MIN_EXT = blendExt.MIN_EXT;
    // var ext = ctx.getExtension("ANGLE_instanced_arrays");
    // ctx.vertexAttribDivisorANGLE = ext.vertexAttribDivisorANGLE;
    // ctx.drawArraysInstancedANGLE = ext.drawArraysInstancedANGLE;
    if(containerId == "body") {
        document.getElementsByTagName(containerId)[0].appendChild(canvas);
    } else {
        document.getElementById(containerId).appendChild(canvas);

    }

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

    function enableExtension(extensions) {
        if(!Array.isArray(extensions)) extensions = [extensions];
        extensions.forEach(function(extension){
            var extProps = ctx.getExtension(extension);
            if(extProps !== null) {
                Object.keys(extProps).forEach(function(ep){
                    if(!ext.hasOwnProperty(ep)){
                        ctx.ext[ep] = extProps[ep];
                    }
                })
            }

        });
    };

    function setUniform(type, location, value) {
        switch(type) {
            case "float":
                ctx.uniform1fv(location, value);
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
                ctx.uniform1iv(location, value);
                break;
            case "ivec2":
                ctx.uniform2iv(location, Int32Array.from(value));
                break;
            case "ivec3":
                ctx.uniform3iv(location, Int32Array.from(value));
                break;
            case "ivec4":
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
            // if(attribute[name].value != value){
                // console.log("set attribute buffer");
                ctx.bufferData(ctx.ARRAY_BUFFER, value, ctx.STATIC_DRAW);
                attribute[name].value = value;
            // }
        }
        // linkAttribute(name);
    }

    function linkAttribute(name) {
        var size = parseInt(attribute[name].type.slice(3,4)) || 1;
        ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].ptr);
        attribute[name].location = ctx.getAttribLocation(program, name);

        ctx.vertexAttribPointer(attribute[name].location, size, ctx.FLOAT, false, 0, 0);
        ctx.enableVertexAttribArray(attribute[name].location);
    }

    function setTexture(name, tex, type, channel){
        var type = type || "float",
            channel = channel  || "alpha";
        // if(tex instanceof Float32Array != true)
        //     tex = new Float32Array(tex);

        ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
        texture[name].value = tex;

        // TODO: Add support for texture compression
        // ctx.compressedTexImage2D(ctx.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT3_EXT, texture[name].dim[0], texture[name].dim[1], 0, tex);
        // ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
        // ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);

        ctx.texImage2D(
            ctx.TEXTURE_2D, 0, ctx[channel.toUpperCase()],
            texture[name].dim[0], texture[name].dim[1], 0,
            ctx[channel.toUpperCase()], ctx[type.toUpperCase()],
            tex
        );
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
    }

    function configResource() {
        for(var ai in attribute) {
            if(attribute[ai].value)
                linkAttribute(ai);
                // setAttribute(ai, attribute[ai].value);
        }

        for(var ui in uniform){
            if(uniform[ui].value !== null) {
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
    }

    webgl.enableExtension = enableExtension;

    webgl.attribute = function(name, type, value) {
        attribute[name] = {type: type,
            value: null,
            location: Object.keys(attribute).length,
            ptr: ctx.createBuffer()
        };

        setAttribute(name, value);
        Object.defineProperty(webgl.attribute, name, {
            get: function() { return attribute[name];},
            set: function(arrayBuffer) {
                setAttribute(name, arrayBuffer);
            }
        });

        return webgl;
    };

    webgl.uniform = function(name, type, value) {
        var size = parseInt(type.slice(3,4)) || parseInt(type.slice(4,5)) || 1;
        uniform[name] = {type: type, value: value, location: null, size: size};

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

    webgl.varying = function(name, type, size) {
        var size = size || 1;
        varying[name] = {type: type, value: null, location: null, size: size};
        return webgl;
    };

    webgl.texture = function(name, type, value, dim, channel){
        texture[name] = {type: type, value: null, location: null, ptr: ctx.createTexture(), dim: dim};
        setTexture(name, value, type, channel);
        Object.defineProperty(webgl.texture, name, {
            get: function() { return texture[name];},
            set: function(texArray) {
                setTexture(name, texArray);
            }
        });

        return webgl;
    }

    webgl.framebuffer = function(name, type, w, h) {
        // framebuffer[name] = {width: w, height: h, ptr: ctx.createFrameBuffer()};
        framebuffer[name] = ctx.createFramebuffer();
        framebuffer[name].width = w || 1024;
        framebuffer[name].height = h || 1024;

        ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer[name]);

        webgl.texture(name, type, null, [w, h], "rgba");

        var renderbuffer = ctx.createRenderbuffer();
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderbuffer);
        ctx.renderbufferStorage(ctx.RENDERBUFFER, ctx.DEPTH_COMPONENT16, framebuffer[name].width, framebuffer[name].height);

        ctx.framebufferTexture2D(ctx.FRAMEBUFFER, ctx.COLOR_ATTACHMENT0, ctx.TEXTURE_2D,  texture[name].ptr, 0);
        ctx.framebufferRenderbuffer(ctx.FRAMEBUFFER, ctx.DEPTH_ATTACHMENT, ctx.RENDERBUFFER, renderbuffer);

        ctx.bindTexture(ctx.TEXTURE_2D, null);
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

        webgl.framebuffer.allowRead = function(name) {
            var textureId = Object.keys(texture).indexOf(name);
            ctx.activeTexture(ctx.TEXTURE0 + textureId);
            ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
            texture[name].location = ctx.getUniformLocation(program, name);
            ctx.uniform1i(texture[name].location, textureId);
        }

        return webgl;
    }

    webgl.sharedFunction = function(name, type, content) {
        sharedFunction[name] = {type: type, fn: content};
        return webgl;
    }

    webgl.env = function(keyValuePairs) {
        Object.keys(keyValuePairs).forEach(function(key){
            env[key] = keyValuePairs[key];
            if(Array.isArray(env[key])){
                var i = 0;
                Object.defineProperty(env, key, {
                    get: function() { return keyValuePairs[key][i++];},
                    set: function(newArray) {
                        i = 0;
                        env[key] = newArray;
                    }
                });
            }
        })
        return webgl;
    }

    webgl.shader = function(arg, fn){
        var shader = {},
            option = arg || {},
            name = option.name || "default",
            type = option.type || "vertex",
            deps = option.require || option.deps || [],
            debug = option.debug || false,
            main = option.main || fn || function() {},
            fbo = option.framebuffer || {};

        var shaderType = {
            vertex: ctx.VERTEX_SHADER,
            fragment: ctx.FRAGMENT_SHADER
        };


        function declareResource(resource, type, name) {
            if(resource == "fn") {
                return toGLSL(type, name, sharedFunction[name].fn);
            } else {
                var pri = resource + " " + type + " " + name;
                if(resource === "uniform" && (uniform[name].value.length) / uniform[name].size > 1)
                    pri += "[" + (uniform[name].value.length) / uniform[name].size + "]";
                else if(resource === "varying" &&  varying[name].size > 1)
                    pri += "[" + varying[name].size + "]";
                else if(resource == "texture") pri = pri.replace("texture", "uniform");
                return pri + ";\n";
            }
        }

        function getResourceProperties(resourceType, resourceName) {
            var resource = {
                attribute: attribute[resourceName],
                uniform: uniform[resourceName],
                varying: varying[resourceName],
                texture: texture[resourceName],
                fn: sharedFunction[resourceName]
            }

            return resource;
        }


        var shaderSource = "precision highp float;\n";
        // if(shaderType === ctx.FRAGMENT_SHADER) shaderSource = "layout(origin_upper_left) in vec4 gl_FragCoord;\n" + shaderSource;
        var envParameters = {};

        if(Array.isArray(deps)){
            deps.forEach(function(dep){

                if(attribute.hasOwnProperty(dep)) {
                    shaderSource += declareResource("attribute", attribute[dep].type, dep);
                } else if(uniform.hasOwnProperty(dep)) {
                    shaderSource += declareResource("uniform", uniform[dep].type, dep);
                } else if(texture.hasOwnProperty(dep)) {
                    shaderSource += declareResource("texture", "sampler2D", dep);
                } else if(varying.hasOwnProperty(dep)) {
                    shaderSource += declareResource("varying", varying[dep].type, dep);
                } else if(sharedFunction.hasOwnProperty(dep)) {
                    shaderSource +=  declareResource("fn", sharedFunction[dep].type, dep);
                }
            });
        } else if(typeof(deps) == "object") {
            Object.keys(deps).forEach(function(resourceType){
                deps[resourceType].forEach(function(dep){
                    shaderSource += declareResource(resourceType, getResourceProperties(dep).type, dep);
                });
            })
        }

        shaderSource += toGLSL("void", "main", main);

        if(debug)
            console.log(shaderSource, env);

        var _shader = compile(shaderType[type], shaderSource);
        _shader._shaderType = shaderType[type];
        shaders[type][name] = _shader;
        return webgl;

    }

    function applyEnvParameters(str, envParameters){
        //find all $(...) and replace them with env params in envParameters
        var re = new RegExp("\\$\\(("+Object.keys(envParameters).join("|")+")\\)","g");
        return str.replace(re, function(matched){
            return envParameters[matched.slice(2,matched.length-1)];
        });
    }

    function toGLSL(returnType, name, fn){
        var glsl = applyEnvParameters(fn.toString(), env);
        return returnType + " " +
            name + "(" + glsl
            .replace(/var\s/g, "float ")
            .replace(/\$(.*)\((.*)\)\s*(=|;)/g, "$1 $2 $3")
            // .replace(/\$(.*?)\./g, "$1 ")
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

    webgl.program = function(name, vertexShaderName, fragmentShaderName, framebufferName) {
        var name = name || "default",
            vs = vertexShaderName || "default",
            fs = fragmentShaderName || "default";

        if(!kernels.hasOwnProperty(name)) {

            if(!shaders.vertex.hasOwnProperty(vs) || !shaders.fragment.hasOwnProperty(fs))
                throw new Error("No vertex or fragment shader is provided!");

            kernels[name] = ctx.createProgram();
            ctx.attachShader(kernels[name], shaders.vertex[vs]);
            ctx.attachShader(kernels[name], shaders.fragment[fs]);
            ctx.linkProgram(kernels[name]);
            var linked = ctx.getProgramParameter(kernels[name], ctx.LINK_STATUS);
            if (!linked) {
                var lastError = ctx.getProgramInfoLog(kernels[name]);
                throw ("Error in program linking:" + lastError);
                ctx.deleteProgram(kernels[name]);
                return null;
            }
        }

        program = kernels[name];
        ctx.useProgram(program);

        configResource();

        return ctx;
    }

    webgl.dimension = function() {
        return [canvas.width, canvas.height];
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
            var line = "uniform sampler2D " + t + ";";
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
}});
