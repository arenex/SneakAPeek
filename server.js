"use strict";
process.title = 'sneakapeek';

var ffmpegBusy = false;
var Driver = require('./driver.js');
var driver = new Driver(
);

const path = require("path");
const express = require("express");

const port = 3000;

const app = express();

// routes
const router = express.Router();
router.get('/', (req, res) => {
    res.json({
        message: "hell world"
    });
});
router.get('/streams', (req, res) => {
    // parse streams from query parameter
    const streams = JSON.parse(`{"o":${req.query.streams}}`).o;

    if (!ffmpegBusy && streams && streams.length) {
        ffmpegBusy = true;
        driver.run(streams).then(channelInfos => {
            console.log(channelInfos);
            ffmpegBusy = false;
            channelInfos.forEach(channel => {
                channel.img = `http://localhost:${port}/${channel.img}`;
            });
            res.json({
                streams: channelInfos
            });
        });
    } else {
        res.json({
            message: "something went wrong"
        });
    }
});

app.use(express.static(path.join(__dirname, "./"), {
    etag: false,
    maxage: '0h'
}));
app.use('/api', router);

// start the server
app.listen(port, function () {
    console.log(`Listening on http://localhost:${port}/`);
});