"use strict";

var twitchID = 'REPLACE WITH YOUR TWITCH CLIENTID';
//use ffmpeg.exe absolute path if executable not in PATH
var ffmpegPath = 'ffmpeg.exe';

var fs, path, Gpath, request, jsdom, JSDOM, jsDomGetDocument;
process.title = 'ffmpegdriver';
var exec = require('child_process').exec;

function grabTwitchFrameAndSave(url, saveName) {
    return new Promise(function(resolve, reject) {
        var cmd = '"'+ffmpegPath+'" -y -i "' + url + '" -ss 00:00:00 -f image2 -vframes 1 ' + saveName;
        exec(cmd, function(error, stdout, stderr) {
            resolve();
        });
    });
}

function run(channelNames) {
    return new Promise(function(resolve, reject) {
        var channelInfos = [];
        var numPrefix = 1000;
        var promises = [];
        channelNames.forEach(function(channelName) {
            var channelInfo = {};
            channelInfo.num = numPrefix++;
            channelInfo.name = channelName;
            var promise = takeStreamPic(channelInfo);
            promises.push(promise);
            promise.then(function(channelInfo) {
                channelInfos.push(channelInfo);
            });
        });
        Promise.all(promises).then(function() {
            resolve(channelInfos);
        })
    });
}

function takeStreamPic(channelInfo) {
    return new Promise(function(resolve, reject) {
        getStreamUrl(channelInfo.name).then(function(url) {
            channelInfo.url = '';
            if (url !== null) {
                channelInfo.url = url;
                var imageSaveName = `img${channelInfo.num}.png`;
                grabTwitchFrameAndSave(url, imageSaveName).then(function() {
                    channelInfo.success = true;
                    resolve(channelInfo);
                });
            } else {
                channelInfo.success = false;
                resolve(channelInfo);
            }
        });
    });
}

function getStreamUrl(twitchChannel) {
    return new Promise(function(resolve, reject) {
        var twitchStreams = require('twitch-get-stream')(twitchID);
        var anyUrl = null;
        twitchStreams.get(twitchChannel)
            .then(function(streams) {
                streams.forEach(function(stream) {
                    if (stream.url) {
                        if (!(stream.quality && stream.quality == 'Audio Only')) {
                            anyUrl = stream.url;
                        }
                    }
                    if (stream && stream.quality && stream.quality.startsWith('480p') && stream.url) {
                        resolve(stream.url);
                        return;
                    }
                });
                resolve(anyUrl);
                return;
            })
            .catch(function(err) {
                resolve(null);
            });
    });
}

module.exports = run;
