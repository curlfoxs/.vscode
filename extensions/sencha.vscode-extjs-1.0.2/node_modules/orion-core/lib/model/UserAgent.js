"use strict";

// Different user agent modules have different pieces of the parsing logic we need.
// For now we are using multiple user agent parsers to get all the ua info we need.
// TODO: refactor Ext.env.Browser and Ext.env.OS as node modules and remove these dependencies
var useragent = require('express-useragent');
var parse = require('user-agent-parser');
var Network = require('orion-core/lib/Network.js');
var Version = require('orion-core/lib/Version');

const nameToIdRe = /[\.:\s\-]/g;

/**
 * A normalized object representation of a user-agent string containing both browser and OS
 * name and version info.
 */
class UserAgent {

    /**
     * Creates a new UserAgent instance by parsing a user-agent string.  Do not invoke
     * this constructor directly, instead use the getInstance() method to retrieve an instance
     * from the cache, or parse if necessary.
     * @param {String} userAgent
     * @param {String} address
     * @private
     */
    constructor(userAgent, address) {
        var info = useragent.parse(userAgent),
            uaInfo = parse(userAgent),
            // express-useragent has the version for windows as part of the os string
            // but does not have the version for other operating systems
            osParts = info.os.split(' '),
            osVersion = new Version(osParts[osParts.length - 1]),
            browserName = info.browser,
            browserVersion = info.version ? new Version(info.version) : Version.ZERO,
            osName = uaInfo.os.name;

        if (osVersion.major === 0) {
            // user-agent-parser sometimes has words in front of the version number
            // e.g. "NT 10.0" so we have to strip just the version number off the end
            if (uaInfo.os.version) {
                // TODO: this approach gives us incorrect version info for Windows XP
                osParts = uaInfo.os.version.split(' ');
                osVersion = new Version(osParts[osParts.length - 1]);
            } else {
                // TODO: can't currently detect Linux version
                osVersion = new Version('0');
            }
        }

        this.userAgent = userAgent;

        /**
         * @property {Object} browser An object containing the name and version info for the browser
         * @property {String} browser.name The browser name
         * @property {Version} browser.version The browser version
         */
        this.browser = {
            name: browserName,
            version: browserVersion,
            fullName: browserName + ' ' + browserVersion.version
        };

        /**
         * @property {Object} os An object containing the name and version info for the OS
         * @property {String} os.name The OS name
         * @property {Version} os.version The OS version
         */
        this.os = {
            name: osName,
            version: osVersion,
            fullName: osName + (osVersion.version != 0 ? (' ' + osVersion.version) : '')
        };

        this.name = this.browser.fullName + ' / ' + this.os.fullName;

        this.id = (this.browser.name + this.browser.version.shortVersion + this.os.name.replace(/\s/g, '') +
            // this horrible hack is here to work around lack of proper version detection
            // for windows xp and linux.
            ((osVersion.shortVersion && (osVersion.shortVersion != 'NaN'))  ?
                osVersion.shortVersion.replace(/ /g, '') : osVersion.version.replace(/[\.\-_]/g, '')));

        this.local = false;
        this.groupKey = '';

        if (address) {
            this.address = address;
        }
    }
    
    get browserRecord() {
        var me = this,
            browserRecord = me._browserRecord;
        
        if (!browserRecord) {
            let browser = me.browser,
                os = me.os;
            
            browserRecord = me._browserRecord = Studio.model.Browser.wrap(new Studio.core.model.browser.Browser({
                name: me.browser.name,
                type: me.browser.name.toLowerCase(),
                version: me.browser.version,
                platformName: os.name,
                platformVersion: os.version
            }));
        }
        
        return browserRecord
    }

    get address() {
        return this._address;
    }

    set address(value) {
        if (this._address) {
            throw new Error('UserAgent address is already set. Unable to change UserAgent address.');
        }

        this._address = value;
        this.groupKey = value.replace(nameToIdRe, '_');

        if (Network.isAddressLocal(value) && (!UserAgent.local || UserAgent.local.isOsEqual(this))) {
            this.groupKey = '_';
            this.local = true;
        }
    }

    get fullId() {
        return this.id.replace(nameToIdRe, '_') + this.groupKey;
    }

    /**
     * Returns true if the OS of this UserAgent is equal to the OS of the passed UserAgent
     * @param {UserAgent/String} userAgent
     */
    isOsEqual(userAgent) {
        var os = this.os,
            otherOs = UserAgent.getInstance(userAgent, this.address).os;

        return ((os.name === otherOs.name) &&
            // For sake of determining equality we only compare major and minor version here
            // because some browsers may not include patch/build release numbers in the user
            // agent string.  For example FF on OSX yosemite has an os version of "10.10"
            // while chrome has "10.10.5".
            (os.version.major === otherOs.version.major) &&
            (os.version.minor === otherOs.version.minor));
    }

    /**
     * Retrieves a UserAgent instance for a given user-agent string and optional address
     * @param {String} userAgent The user-agent string
     * @param {String} address The IP address of the userAgent
     */
    static getInstance(userAgent, address) {
        var instances = UserAgent.instances;

        if (userAgent instanceof UserAgent) {
            return userAgent;
        }

        address = address || '';
        var addresses = instances[userAgent] || (instances[userAgent] = {});

        return addresses[address] || (addresses[address] = new UserAgent(userAgent, address));
    }

    /**
     * @property {UserAgent} local
     * The UserAgent for the local environment this code is running in (`null` if not
     * running in a browser)
     */
    static get local() {
        var ua = UserAgent._local;

        if (!('_local' in UserAgent)) {
            ua = UserAgent._local = (typeof(navigator) != 'undefined' && navigator.userAgent ? new UserAgent(navigator.userAgent) : null);
        }

        return ua;
    }

    static fromRequest(request) {
        var address = request.connection.remoteAddress;

        if (address.startsWith('::ffff:')) {
            // IPv4 address mapped into IPv6 space - strip prefix
            address = address.substr(7);
        }
        return UserAgent.getInstance(request.headers['user-agent'], address);
    }
}

/**
 * @property {Object} instances
 * UserAgent cache, keyed by user-agent_address string
 * @static
 */
UserAgent.instances = {};

module.exports = UserAgent;
