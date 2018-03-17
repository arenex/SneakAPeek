"use strict";
process.title = 'sneakapeek';

// websocket and http servers
var webSocketServer = require('websocket').server; //{@websocket@1.0.23@}
var http = require('http');
var server, wsServer;
var webSocketsServerPort = 1515;
var clients = [];
__setupWebSocket();

var ffmpegBusy = false;
var Driver = require('./driver.js');
var driver = new Driver(
);

function sendChannelInfo(channelInfos) {
    var obj = {};
    obj.status = 'request_complete';
    obj.channelInfos = channelInfos;
    sendResponseToClient(obj);
}

function processClientRequest(message) {
    try {
        var obj = JSON.parse(message);
        if (!ffmpegBusy && obj.command == 'makesnapshots' && obj.channels != null) {
            ffmpegBusy = true;
            driver.run(obj.channels).then(channelInfos => {
                console.log(channelInfos);
                ffmpegBusy = false;
                sendChannelInfo(channelInfos);
            });
        }
    } catch (e) {
        console.log('Error:', e);
        // ToDo: sendResponseToClient({response: "Bad Request"});
    }
}

function sendResponseToClient(object) {
    // broadcast
    var jsonMsg = JSON.stringify(object);
    console.log('sending to clients');
    clients.forEach(function (client) {
        client.sendUTF(jsonMsg);
    });
}

function __setupWebSocket() {
    // Http server
    server = http.createServer(function (request, response) {});
    server.listen(webSocketsServerPort, function () {
        console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
    });

    // WebSocket server - tied to a HTTP server. WebSocket request is just an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    wsServer = new webSocketServer({
        httpServer: server
    });

    // This callback function is called every time someone tries to connect to the WebSocket server
    wsServer.on('request', function (request) {
        console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
        // accept connection - you should check 'request.origin' to make sure that client is connecting from your website (http://en.wikipedia.org/wiki/Same_origin_policy)
        var connection = request.accept(null, request.origin);
        // we need to know client index to remove them on 'close' event
        var index = clients.push(connection) - 1;
        console.log((new Date()) + ' Connection accepted.');

        // user sent some message
        connection.on('message', function (message) {
            if (message.type === 'utf8') { // accept only text
                processClientRequest(message.utf8Data);
            }
        });

        // user disconnected
        connection.on('close', function (connection) {
            console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            clients.splice(index, 1); // remove user from the list of connected clients
        });
    });
}

const path = require("path");
const express = require("express");
const app = express();
const dir = path.join(__dirname, "./");
app.use(express.static(dir, {
    etag: false,
    maxage: '0h'
}));
app.listen(3000, function () {
    console.log("Listening on http://localhost:3000/");
});