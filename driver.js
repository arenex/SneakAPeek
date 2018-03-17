"use strict";
process.title = 'sneakapeek-driver';

const {
    exec
} = require('child_process');

class Driver {
    constructor(twitchId, ffmpegPath = "ffmpeg") {
        this.twitchId = twitchId;
        this.ffmpegPath = ffmpegPath;
    }
    grabTwitchFrameAndSave(url, saveName) {
        return new Promise((resolve, reject) => {
            var cmd = [
                'rm -f ' + saveName,
                '"' + this.ffmpegPath + '" -y -i "' + url + '" -ss 00:00:00 -f image2 -vframes 1 ' + saveName
            ].join(' && ');
            console.log(cmd);
            exec(cmd, (error, stdout, stderr) => {
                resolve();
            });
        });
    }
    run(channelNames) {
        var channelInfos = [];
        var numPrefix = 1000;
        var promises = [];
        channelNames.forEach(channelName => {
            var channelInfo = {};
            channelInfo.num = numPrefix++;
            channelInfo.name = channelName;
            var promise = this.takeStreamPic(channelInfo);
            promises.push(promise);
        });
        return Promise.all(promises);
    }
    takeStreamPic(channelInfo) {
        return new Promise((resolve, reject) => {
            this.getStreamUrl(channelInfo.name).then(url => {
                channelInfo.url = '';
                if (url !== null) {
                    channelInfo.url = url;
                    var imageSaveName = `img${channelInfo.num}.png`;
                    this.grabTwitchFrameAndSave(url, imageSaveName).then(() => {
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
    getStreamUrl(twitchChannel) {
        return new Promise((resolve, reject) => {
            var anyUrl = null;
            require("twitch-get-stream")(this.twitchId).get(twitchChannel).then(streams => {
                streams.forEach(stream => {
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
            }).catch(err => {
                console.error(err);
                resolve(null);
            });
        });
    }
};

module.exports = Driver;