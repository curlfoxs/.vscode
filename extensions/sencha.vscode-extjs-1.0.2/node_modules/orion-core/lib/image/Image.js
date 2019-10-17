'use strict';

var Base = require('../Base'),
    hasDoc = (typeof document !== 'undefined'),
    canvas;

var fs = require('fs');

class Image extends Base {

    constructor(cfg) {
        super();
        var me = this;
        if (typeof cfg === 'string') {
            cfg = {
                src: cfg
            };
        }
        Object.assign(me, cfg);
        if (!me.data && me.width != null && me.height != null) {
            me.data = new Array(me.width * me.height * 4);
        }
    }

    getCanvas () {
        if (hasDoc && !canvas) {
            canvas = document.createElement('canvas');
        }
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return canvas;
    }

    load () {
        var me = this;
        return new Promise(function(resolve, reject) {
            try {
                if (me.src) {
                    var canvas = me.getCanvas();
                    if (canvas) {
                        var ctx = canvas.getContext('2d'),
                            img = document.createElement('img');

                        img.onload = function () {
                            var width = img.width,
                                height = img.height;
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            Object.assign(me, {
                                width: width,
                                height: height,
                                data: ctx.getImageData(0, 0, width, height).data
                            });
                            img.onload = null;
                            resolve(me);
                        };

                        img.src = me.src;
                        if (img.complete) {
                            img.onload();
                        }
                    } else {
                        var pngjs = require('pngjs2'),
                            fs = require('fs'),
                            PNG = pngjs.PNG,
                            png = new PNG({});
                        me.png = png;
                        png.on('parsed', function (data) {
                            Object.assign(me, {
                                data: data,
                                width: png.width,
                                height: png.height
                            });
                            png.removeAllListeners();
                            resolve(me);
                        });
                        fs.createReadStream(me.src).pipe(png);
                    }
                } else {
                    resolve(me);
                }
            } catch (err) {
                debugger;
                reject(err);
            }
        });
    }

    save (path) {
        path = path + '';
        var me = this,
            pngjs = require('pngjs2'),
            output = new pngjs.PNG({
                width: me.width,
                height: me.height
            });
        return new Promise(function(resolve, reject){
            output.data = me.data;
            var writeStream = fs.createWriteStream(path);
            writeStream.on('close', function(){
                resolve(me);
            });
            writeStream.on('error', function(err){
                reject(err);
            });
            output.pack().pipe(writeStream);
        });
    }
}

Image.prototype.isImage = true;

module.exports = Image;
