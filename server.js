"use strict";
process.title = 'sneakapeek';

const path = require("path");
const express = require("express");
const port = 3000;
const app = express();

var outputDir = path.resolve(__dirname,'output');
var ffmpegBusy = false;
var Driver = require('./driver.js');
var driver = new Driver(
    null, //twitchID TODO
    outputDir,
    null //ffmpegPath TODO
);

// routes
const router = express.Router();
router.get('/', (req, res) => {
    res.json({
        message: "hell world"
    });
});
router.get('/streams', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    // parse streams from query parameter
    const streams = JSON.parse(req.query.streams);

    if (!ffmpegBusy && streams && streams.length) {
        ffmpegBusy = true;
        driver.run(streams).then(channelInfos => {
            console.log(channelInfos);
            ffmpegBusy = false;
            for(let channel in channelInfos){
                channelInfos[channel].img = `http://localhost:${port}/${channelInfos[channel].img}`;
            }
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