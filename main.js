"use strict";
process.title = 'run-server';

var Server = require('./server.js');
var config = require('./config.js');
const server = Server(config);

const opn = require('opn');
opn(config.openBrowserUrl);