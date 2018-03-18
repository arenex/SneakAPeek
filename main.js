"use strict";
process.title = 'run-server';

var Server = require('./server.js');
var config = require('./config.js');
Server(config);

const opn = require('opn');
opn(config.openBrowserUrl);