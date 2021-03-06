"use strict";
process.title = 'sneakapeek-driver';

const {
    exec
} = require('child_process');
const path = require("path");
const fs = require("fs");
const twitchGetStream = require("twitch-get-stream");

function execP(cmd) {
    return new Promise((resolve) => {
        exec(cmd, () => {
            resolve();
        });
    });
}

function clearDirPng(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.filter(filePath => path.extname(filePath) === ".png").forEach(filePath => {
        filePath = path.join(dirPath, filePath);
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.error(e);
        }
    })
};

class Driver {
    constructor(twitchId, workingDir, ffmpegPath = "ffmpeg") {
        this.twitchId = twitchId;
        this.workingDir = workingDir;
        this.outputDirName = 'output';
        this.outputDirPath = path.resolve(this.workingDir, this.outputDirName);
        this.ffmpegPath = ffmpegPath;
        this.getTwitchStream = (channel) => twitchGetStream(this.twitchId).get(channel);
    }
    grabTwitchFrameAndSave(url, imgFullPath) {
        return execP(`"${this.ffmpegPath}" -y -i "${url}" -ss 00:00:00 -f image2 -vframes 1 ${imgFullPath}`);
    }
    run(channelNames) {
        var channelInfos = [];
        var numPrefix = 1000;
        var promises = [];
        clearDirPng(this.outputDirPath);
        channelNames.forEach(channelName => {
            var channelInfo = {};
            channelInfo.num = numPrefix++;
            channelInfo.name = channelName.toString();
            var promise = this.takeStreamPic(channelInfo);
            promises.push(promise);
        });
        return Promise.all(promises).then(streams => {
            return streams.reduce((result, stream) => {
                result[stream.name] = stream;
                return result;
            }, {});
        });
    }
    takeStreamPic(channelInfo) {
        const imgUrl = path.join(this.outputDirName, `img${channelInfo.num}_${Date.now()}.png`);
        const imgFullPath = path.resolve(this.workingDir, imgUrl);
        channelInfo.imgUrl = null;
        return new Promise((resolve) => {
            this.getStreamUrl(channelInfo.name).then(url => {
                channelInfo.streamUrl = '';
                if (url !== null) {
                    channelInfo.streamUrl = url;
                    this.grabTwitchFrameAndSave(url, imgFullPath).then(() => {
                        channelInfo.success = true;
                        channelInfo.imgUrl = imgUrl;
                        resolve(channelInfo);
                    });
                } else {
                    channelInfo.success = false;
                    resolve(channelInfo);
                }
            });
        }).then(channelInfo => {
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