define(function(){
    "use strict";
    return function GLArrayBuffer(arg) {
        var arrayBuffer = (this instanceof GLArrayBuffer) ? this : {},
            option = arg || {},
            ctx = option.name || null,
            name = option.name || null,
            type = option.type || "float",
            data = option.data || null,
            size = parseInt(type.slice(3,4)) || 1,
            buffer = null,
            location = null;

        if( ctx === null || name === null)
            throw new Error("ERROR: invalid glContext or no name is provided for GLArrayBuffer!");

        buffer = ctx.createBuffer();

        arrayBuffer.enable = function(program) {
            ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
            location = ctx.getAttribLocation(program, name);
            ctx.vertexAttribPointer(location, size, ctx.FLOAT, false, 0, 0);
            ctx.enableVertexAttribArray(location);
            return ArrayBuffer;
        }

        arrayBuffer.update = function(_data) {
            if(ArrayBuffer.isView(_data)){
                data = _data;
                ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, data, ctx.STATIC_DRAW);
            } else {
                throw Error("ERROR: invalid input format to GLArrayBuffer!")
            }
            return ArrayBuffer;
        }

        if(data !== null) arrayBuffer.update(data);

        return arrayBuffer;
    }
})
