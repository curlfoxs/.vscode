'use strict';

const Exec   = require('child_process').exec;
const Crypto = require('crypto');
const OS     = require('os');

const Base = require('../Base');

const NO_BUENO = 'Could not determine MAC address';
const macRe  = /(?:[a-z0-9]{2}[:\-]){5}[a-z0-9]{2}/ig;
const zeroRe = /(?:[0]{2}[:\-]){5}[0]{2}/;
const COMMAND = (OS.platform().indexOf('win') === 0) ? 'getmac' : 'ifconfig || ip link';
const dashRe = /-/g;
const splitRe = /[,|]/;

class Mac extends Base {
    static get meta () {
        return {
            prototype: {
                _expire: 0,
                executor: null,

                ttl: 5 * 60 * 1000
            }
        };
    }

    /**
     * Returns the hashes of a given set of MAC address, optionally joining them.
     * @param {String[]} addresses The MAC addresses.
     * @param {String} [join] An optional string by which to join() the hashes.
     * @return {String/String[]}
     */
    static hashify (addresses, join) {
        var hashes = addresses.map(mac => {
            return Crypto.createHash('sha1').update(mac).digest('base64');
        });

        if (join) {
            hashes = hashes.join(join);
        }

        return hashes;
    }

    /**
     * Determines the intersection of two fingerprints (MAC address hashes joined by "|").
     * If there are no intersections, this method will return an empty string.
     * @param {String/String[]} fp1 The first fingerprint.
     * @param {String/String[]} fp2 The second fingerprint.
     * @return {String} The fingerprint intersection (the common MAC hashes joined by "|").
     */
    static intersect (fp1, fp2) {
        var h1 = (typeof fp1 === 'string') ? fp1.split(splitRe) : fp1,
            h2 = (typeof fp2 === 'string') ? fp2.split(splitRe) : fp2,
            common = h1.filter(v => h2.indexOf(v) > -1);

        return common.join('|');
    }

    /**
     * Parses the output of the native command to retrieve MAC addresses and returns the
     * MAC addresses as an array.
     * @param {String} data The command stdout.
     * @return {String[]} The MAC address or `null` if none were found.
     */
    static parse (data) {
        var addresses = [],
            addr, match;

        while (!!(match = macRe.exec(data))) {
            addr = match[0];

            if (!zeroRe.test(addr)) {
                // Normalize for happy hashing:
                addr = addr.trim();
                addr = addr.toUpperCase(); // TODO v0 ????
                addr = addr.replace(dashRe, ':'); // Windows uses -'s

                //addr = addr.replace(/3/g, '4'); // TEST: force MAC address to mismatch

                addresses.push(addr);
            }
        }

        return addresses.length ? addresses : null;
    }

    /**
     * Finds the MAC addresses for this machine and delivers them via a Promise. This
     * result is cached for 5 minutes. After that time, the next call will redetermine
     * the current MAC addresses.
     * @return {Promise<String[]>}
     */
    get () {
        var me = this,
            now = Date.now(),
            executor = (now < me._expire) ? me.executor : null;

        if (!executor) {
            me._expire = now + me.ttl;

            me.executor = executor = new Promise((resolve, reject) => {
                Exec(COMMAND, (error, data) => {
                    var addresses;

                    if (error) {
                        var e = (typeof error === 'string') ? new Error(error) : error;

                        e.message = NO_BUENO + ': ' + e.message;

                        reject(e);
                    }
                    else if (!(addresses = Mac.parse(data))) {
                        reject(new Error(NO_BUENO));
                    }
                    else {
                        resolve(addresses);
                    }
                });
            });
        }

        return executor;
    }

    /**
     * Finds the MAC addresses for this machine and delivers their hashes via a Promise
     * as a single string joined by "|".
     * @return {Promise<String>}
     */
    getFingerprint () {
        return this.getHashes('|');
    }

    /**
     * Finds the MAC addresses for this machine and delivers their hashes via a Promise.
     * @param {String} [join] An optional string to use to join the hashes into a single
     * string.
     * @return {Promise<String/String[]>}
     */
    getHashes (join) {
        return this.get().then(addresses => {
            return Mac.hashify(addresses, join);
        });
    }

    /**
     * Determines if the provided MAC address hash intersects with the MAC addresses of
     * this machine.
     * @param {String} fingerprint The valid MAC address hashes joined by "|".
     * @return {Promise<Boolean>}
     */
    verify (fingerprint) {
        return this.getHashes().then(hashes => {
            return !!Mac.intersect(fingerprint, hashes);
        });
    }
}

module.exports = Mac;
