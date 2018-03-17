"use strict";
process.title = 'sneakapeek-driver';

const {
    exec
} = require('child_process');
const twitchGetStream = require("twitch-get-stream");

function execP(cmd) {
    return new Promise((resolve) => {
        exec(cmd, () => {
            resolve();
        });
    });
}

class Driver {
    constructor(twitchId, ffmpegPath = "ffmpeg") {
        this.twitchId = twitchId;
        this.ffmpegPath = ffmpegPath;
        this.getTwitchStream = (channel) => twitchGetStream(this.twitchId).get(channel);
    }
    grabTwitchFrameAndSave(url, saveName) {
        return execP(`"${this.ffmpegPath}" -y -i "${url}" -ss 00:00:00 -f image2 -vframes 1 ${saveName}`);
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
        const imageSaveName = `img${channelInfo.num}.png`;
        return execP(`rm -f ${imageSaveName}`).then(() => {
            channelInfo.img = null;
            return new Promise((resolve) => {
                this.getStreamUrl(channelInfo.name).then(url => {
                    channelInfo.url = '';
                    if (url !== null) {
                        channelInfo.url = url;
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
        }).then(channelInfo => {
            channelInfo.img = imageSaveName;
            return channelInfo;
        });
    }
    getStreamUrl(twitchChannel) {
        return new Promise((resolve, reject) => {
            var anyUrl = null;
            this.getTwitchStream(twitchChannel).then(streams => {
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