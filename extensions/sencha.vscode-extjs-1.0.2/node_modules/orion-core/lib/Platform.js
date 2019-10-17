'use strict';

const fs  = require('fs');
const os  = require('os');
const xfs = require('./xfs');

const mkdirp = require('mkdirp');
const Base   = require('./Base');

class Platform extends Base {
    static get meta () {
        return {
            prototype: {
                /**
                 * Location of logfile is same as @appRoot
                 */
                logFileName: 'log.txt'
            }
        };
    }

    ctor () {
        let me = this,
            product = me.app.license,
            appRoot = xfs.profileDir.join(product.appShortName).join(product.appMajorVer+'');

        // appRoot is versioned so next major version doesn't trample on old version
        mkdirp.sync(me.appRoot = appRoot.getPath());

        me.clearLog();
        me.log('***** STARTING ' + product.appName + '*****');
    }

    get asar () {
        return this._asar;
    }

    set asar (asar) {
        this._asar = asar;
        this.asarExists = fs.existsSync(asar);
    }

    get asarExists () {
        return this._asarExists;
    }

    set asarExists (exists) {
        this._asarExists = !!exists;
    }

    error (msg) {
        this.writeMsg(' -- [E] ' + msg);
    }

    log (msg) {
        this.writeMsg(' -- [I] ' + msg);
    }

    warn (msg) {
        this.writeMsg(' -- [W] ' + msg);
    }

    writeMsg (msg) {
        let date = new Date();

        fs.appendFileSync(xfs.join(this.appRoot, this.logFileName),
            date.toISOString() + msg + '\n'
        );
    }

    clearLog () {
        try {
            fs.unlinkSync(xfs.join(this.appRoot, this.logFileName));
        }
        catch (e) {
            //no logfile exists; no need to worry
        }
    }
}

module.exports = Platform;
