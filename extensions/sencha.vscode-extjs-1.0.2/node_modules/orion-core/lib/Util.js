'use strict';

const UserAgent = require('orion-core/lib/model/UserAgent.js');
const Network = require('orion-core/lib/Network.js');
const os = require('os');

const crlfRe = /\r\n/g;

var Util = {
    isWin: /^win/.test(process.platform),
    isLinux: /^linux/.test(process.platform),
    isMac: /^darwin/.test(process.platform),

    clone (object) {
        var c = object,
            i;

        if (object != null) {
            if (Array.isArray(object)) {
                c = [];

                for (i = object.length; i-- > 0;) {
                    c[i] = Util.clone(object[i]);
                }
            }
            else if (c.constructor === Object) {
                c = {};

                for (i in object) {
                    c[i] = Util.clone(object[i]);
                }
            }
        }

        return c;
    },

    merge (destination, sources) {
        sources = Array.prototype.slice.call(arguments, 1);

        var n = sources.length,
            i, key, object, sourceKey, value;

        for (i = 0; i < n; ++i) {
            if (!(object = sources[i])) {
                continue;
            }

            for (key in object) {
                value = object[key];

                if (value && value.constructor === Object) {
                    sourceKey = destination[key];

                    if (sourceKey && sourceKey.constructor === Object) {
                        Util.merge(sourceKey, value);
                    } else {
                        destination[key] = Util.clone(value);
                    }
                } else {
                    destination[key] = value;
                }
            }
        }

        return destination;
    },

    nativizeLines (text) {
        return Util.normalizeLines(text, Util.EOL);
    },

    normalizeLines (text, eol) {
        if (crlfRe.test(text)) {
            text = text.replace(crlfRe, eol || '\n');
        }

        return text;
    },

    flatten (array, flattened) {
        flattened = flattened || [];
        if (array) {
            for (var i = 0; i < array.length; i++) {
                var elem = array[i];
                if (Array.isArray(elem)) {
                    this.flatten(elem, flattened);
                }
                else {
                    flattened.push(elem);
                }
            }
        }
        return flattened;
    },

    getLocalIpAddresses: Network.getLocalIpAddresses,

    getLocalIpAddress: Network.getLocalIpAddress,

    isAddressLocal (address, userAgent) {
        // If local os is not equal to userAgent os proceed no futher because the request
        // can't have originated on the local machine, even if the ip address is local
        // (it may be a virtual machine using the loopback interface)
        if (!userAgent || (UserAgent.local && UserAgent.local.isOsEqual(userAgent))) {
            return Network.isAddressLocal(address);
        }

        return false;
    },

    createMap (array, keyGetter) {
        var index = {};
        array && array.forEach(function(item){
            var key = keyGetter(item);
            index[key] = item;
        });
        return index;
    }
};

Util.EOL = Util.isWin ? '\r\n' : '\n';

module.exports = Util;
