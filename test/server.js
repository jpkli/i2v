var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app);

var port = process.env.PORT || 8100,
    host = process.env.HOST || "localhost";

var nodeDsv = require('../p4/src/io/node-dsv'),
    cstore = require('../p4/src/cquery/cstore');

console.log("initializing server ");

// Static files
app.use(express.static('.'));
app.use(express.static('..'));
app.use("/i2v", express.static('../src'));
app.use("/p4", express.static('../p4/src'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var dataStore, metadata;

function setupDataStore(size) {
    process.stdout.write("Loading data for terminals ...");
    dataStore = cstore({
        size: size,
        struct: {
            rank                : "int",
            timestamp           : "float",
            numeric1            : "int",
            numeric2            : "int",
            categorical1        : "string",
            numeric3            : "int"
        },
    });
    // dataStore = cstore({
    //     size: size,
    //     struct: {
    //         rank                : "int",
    //         packets_finished    : "float",
    //         data_size           : "float",
    //         avg_hops            : "float",
    //         avg_packet_latency  : "float",
    //         busy_time           : "float",
    //         timestamp           : "float"
    //     },
    // });
}

nodeDsv.read({
    filepath  : "./randomData.csv",
    delimiter : ",",
    onopen    : setupDataStore,
    onload    : function(n) { dataStore.addRows(n) },
    oncomplete: function() {
        metadata = dataStore.metadata();
        console.log("... done (" + metadata.count + ").");
        startServer();
    }
})

function startServer() {
    var data = dataStore.data();

    app.get('/metadata', function(req, res){
        res.json(metadata);
    });

    app.get('/data', function(req, res){
        var buffers = [];
        metadata.keys.forEach(function(k, ki){
            buffers.push(new Buffer(data[ki].buffer));
        });
        var buf = Buffer.concat(buffers);
        res.end(buf, 'binary');
    });

    server.listen(port, host, function(){
        console.log("server started, listening", host, port);
    });
}
