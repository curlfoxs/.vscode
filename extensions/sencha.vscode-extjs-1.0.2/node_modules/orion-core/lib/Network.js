'use strict';

var os = require('os');

var Network = {

    getLocalIpAddresses () {
        var ifaces = os.networkInterfaces(),
            detected = {};

        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' !== iface.family || iface.internal !== false) {
                    return;
                }
                detected[iface.address] = ifname;
            });
        });

        return Object.keys(detected);
    },

    getLocalIpAddress () {
        var addresses = this.getLocalIpAddresses();
        if (addresses.length === 1) {
            return addresses[0];
        }
        return "127.0.0.1";
    },

    isAddressLocal (address) {
        var isLocal = false,
            interfaces, key;

        // If local os is not equal to userAgent os proceed no futher because the request
        // can't have originated on the local machine, even if the ip address is local
        // (it may be a virtual machine using the loopback interface)
        interfaces = os.networkInterfaces();

        for (key in interfaces) {
            isLocal = interfaces[key].some(function(item) {
                if (item.address === address) {
                    return true;
                }
            });
            if (isLocal) {
                break;
            }
        }

        return isLocal;
    }
};

module.exports = Network;
