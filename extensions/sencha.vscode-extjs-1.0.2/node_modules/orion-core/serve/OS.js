/**
 * @class ST.OS
 * Provides information about operating system environment.
 *
 * Should not be manually instantiated unless for unit-testing.
 * Access the global instance stored in {@link ST.os} instead.
 */
ST.OS = ST.define(function (OS) {
return {
    statics: {
        /**
         * Normalizes the osPrefixes object to get each value
         * an object with an array of RegExps and the name set.
         * This makes the {@link checkUserAgent} method simpler.
         */
        parsePrefixes: function () {
            var proto = this.prototype,
                prefixes = proto.osPrefixes,
                names = proto.osNames,
                code, prefix, type, name, i, length, re;

            for (code in prefixes) {
                prefix = prefixes[code];
                type = typeof prefix;
                name = names[code];

                if (type === 'string') {
                    prefix = prefixes[code] = {
                        //need to parse a string into a RegExp
                        re: [ new RegExp('(?:' + prefix + ')([^\\s;)]+)') ]
                    };
                } else if (type === 'object') {
                    if (typeof prefix.re === 'string') {
                        //need to parse a string into a RegExp
                        prefix.re = [ new RegExp('(?:' + prefix.re + ')([^\\s;)]+)') ];
                    } else if (!prefix.re.length) {
                        // isn't an array
                        prefix.re = [
                        prefix.re];
                    } else {
                        i = 0;
                        length = prefix.re.length;

                        for (; i < length; i++) {
                            re = prefix.re[i];

                            if (typeof re === 'string') {
                                //need to parse a string into a RegExp
                                prefix.re[i] = new RegExp('(?:' + re + ')([^\\s;)]+)');
                            }
                        }
                    }
                }

                if (name && !prefix.name) {
                    prefix.name = name;
                }
            }
        }
    },

    constructor: function (userAgent, platform, browserScope) {
        var me = this,
            names = me.osNames,
            is = me.is,
            name, version,
            i, item;

        browserScope = browserScope || ST.browser;

        me.checkUserAgent(userAgent);

        name = me.name;
        version = me.version;

        me.setFlag(name);

        if (version) {
            me.setFlag(name + (version.getMajor() || ''));
            me.setFlag(name + version.getShortVersion());
        }

        if (platform) {
            me.setFlag(platform.replace(/ simulator$/i, ''));
        }

        for (i in names) {
            if (names.hasOwnProperty(i)) {
                item = names[i];

                if (!is.hasOwnProperty(name)) {
                    this.setFlag(item, (name === item));
                }
            }
        }

        // Detect if the device is the iPhone 5.
        if (name === 'iOS' && window.screen.height === 568) {
            this.setFlag('iPhone5');
        }

        if (browserScope.is.Safari || browserScope.is.Silk) {
            // ST.browser.version.shortVersion == 501 is for debugging off device
            if (this.is.Android2 || this.is.Android3 || browserScope.version.shortVersion === 501) {
                browserScope.setFlag('AndroidStock');
            }
            if (this.is.Android4) {
                browserScope.setFlag('AndroidStock');
                browserScope.setFlag('AndroidStock4');
            }
        }
    },

    checkUserAgent: function (userAgent, prefix) {
        var me = this,
            prefixes = me.osPrefixes,
            names = me.osNames,
            code, prefix, name,
            regExps, i, length,
            re, match, match1, version;

        for (code in prefixes) {
            prefix = prefixes[code];
            regExps = prefix.re;
            i = 0;
            length = regExps.length;

            for (; i < length; i++) {
                re = regExps[i];
                match = userAgent.match(re);

                if (match) {
                    name = prefix.name || names[code];
                    match1 = match[1];

                    if (match1) {
                        // This is here because some HTC android devices show an OSX Snow Leopard userAgent by default.
                        // And the Kindle Fire doesn't have any indicator of Android as the OS in its User Agent
                        if (match1 === 'HTC_' || match1 === 'Silk/') {
                            version = new ST.Version('2.3');
                        } else {
                            version = new ST.Version(match[match.length - 1]);
                        }
                    } else if (prefix.version) {
                        //allow a version to be coded when not found in the userAgent
                        version = new ST.Version(prefix.version);
                    }

                    break;
                }
            }

            if (match) {
                break;
            }
        }

        if (!name) {
            name = names[(userAgent.toLowerCase().match(/mac|win|linux/) || ['other'])[0]];
        }

        if (!version) {
            version = new ST.Version('');
        }

        me.name = name;
        me.version = version;

        return {
            name: name,
            version: version
        };
    },

    osNames: {
        android: 'Android',
        bada: 'Bada',
        blackberry: 'BlackBerry',
        chromeOS: 'ChromeOS',
        ios: 'iOS',
        linux: 'Linux',
        mac: 'MacOS',
        other: 'Other',
        rimTablet: 'RIMTablet',
        tizen: 'Tizen',
        webos: 'webOS',
        winXp: 'Windows XP',
        winVista: 'Windows Vista',
        win7: 'Windows 7',
        win8: 'Windows 8.0',
        win81: 'Windows 8.1',
        win: 'Windows',
        windowsPhone: 'WindowsPhone'
    },

    osPrefixes: {
        android: '(Android |HTC_|Silk/)',
        bada: 'Bada/',
        blackberry: '(?:BlackBerry|BB)(?:.*)Version/',
        chromeOS: 'CrOS ',
        ios: 'i(?:Pad|Phone|Pod)(?:.*)CPU(?: iPhone)? OS ',
        linux: 'Linux (?:x86_64|i686); rv:',
        mac: 'Mac OS X ',
        rimTablet: 'RIM Tablet OS ',
        tizen: '(Tizen )',
        webos: '(?:webOS|hpwOS)/',
        winXp: {
            re: /Windows (?:NT\s)?5\.1/
        },
        winVista: {
            re: /Windows (?:NT\s)?6\.0/
        },
        win7: {
            re: /Windows (?:NT\s)?6\.1/,
            version: '7.0'
        },
        win8: {
            re: /Windows (?:NT\s)?6\.2/,
            version: '8.0'
        },
        win81: {
            re: /Windows (?:NT\s)?6\.3/,
            version: '8.1'
        },
        win: 'Windows (?:NT\\s)?',
        windowsPhone: 'Windows Phone '
    },

    /**
     * A "hybrid" property, can be either accessed as a method call, i.e:
     *
     *     if (ST.os.is('Android')) {
     *         // ...
     *     }
     *
     * or as an object with boolean properties, i.e:
     *
     *     if (ST.os.is.Android) {
     *         // ...
     *     }
     *
     * Versions can be conveniently checked as well. For example:
     *
     *     if (ST.os.is.Android2) {
     *         // Equivalent to (ST.os.is.Android && ST.os.version.equals(2))
     *     }
     *
     *     if (ST.os.is.iOS32) {
     *         // Equivalent to (ST.os.is.iOS && ST.os.version.equals(3.2))
     *     }
     *
     * Note that only {@link ST.Version#getMajor major component} and {@link ST.Version#getShortVersion simplified}
     * value of the version are available via direct property checking. Supported values are:
     *
     * - iOS
     * - iPad
     * - iPhone
     * - iPhone5 (also true for 4in iPods).
     * - iPod
     * - Android
     * - WebOS
     * - BlackBerry
     * - Bada
     * - MacOS
     * - Windows
     * - Linux
     * - Other
     * @member ST.os
     * @param {String} name The OS name to check.
     * @return {Boolean}
     */
    is: function (name) {
        return !!this[name];
    },

    /**
     * @property {String} [name=null]
     * @readonly
     * @member ST.os
     * The full name of the current operating system. Possible values are:
     *
     * - iOS
     * - Android
     * - WebOS
     * - BlackBerry,
     * - MacOS
     * - Windows
     * - Linux
     * - Other
     */
    name: null,

    /**
     * @property {ST.Version} [version=null]
     * Refer to {@link ST.Version}
     * @member ST.os
     * @readonly
     */
    version: null,

    setFlag: function (name, value) {
        if (value === undefined) {
            value = true;
        }

        if (this.flags) {
            this.flags[name] = value;
        }
        this.is[name] = value;
        this.is[name.toLowerCase()] = value;

        return this;
    }
}},
function (OS) {
    var userAgent = navigator.userAgent,
        is = (ST.is || (ST.is = {})),
        osEnv, osName, deviceType;

    OS.parsePrefixes();

    OS.prototype.flags = is;

    /**
     * @class ST.os
     * @extends ST.OS
     * @singleton
     * Provides useful information about the current operating system environment.
     *
     * Example:
     *
     *     if (ST.os.is.Windows) {
     *         // Windows specific code here
     *     }
     *
     *     if (ST.os.is.iOS) {
     *         // iPad, iPod, iPhone, etc.
     *     }
     *
     *     console.log("Version " + ST.os.version);
     *
     * For a full list of supported values, refer to the {@link #is} property/method.
     *
     */
    ST.os = osEnv = new OS(userAgent, navigator.platform);

    osName = osEnv.name;

    // A couple compatible flavors:
    ST['is' + osName] = true; // e.g., ST.isWindows
    ST.isMac = is.Mac = is.MacOS;

    var search = window.location.search.match(/deviceType=(Tablet|Phone)/),
        nativeDeviceType = window.deviceType;

    // Override deviceType by adding a get variable of deviceType. NEEDED FOR DOCS APP.
    // E.g: example/kitchen-sink.html?deviceType=Phone
    if (search && search[1]) {
        deviceType = search[1];
    }
    else if (nativeDeviceType === 'iPhone') {
        deviceType = 'Phone';
    }
    else if (nativeDeviceType === 'iPad') {
        deviceType = 'Tablet';
    }
    else {
        if (!osEnv.is.Android && !osEnv.is.iOS && !osEnv.is.WindowsPhone && /Windows|Linux|MacOS/.test(osName)) {
            deviceType = 'Desktop';

            // always set it to false when you are on a desktop not using Ripple Emulation
            ST.browser.is.WebView = !!ST.browser.is.Ripple;
        }
        else if (osEnv.is.iPad || osEnv.is.RIMTablet || osEnv.is.Android3 ||
                 ST.browser.is.Silk ||
                (osEnv.is.Android && userAgent.search(/mobile/i) === -1)) {
            deviceType = 'Tablet';
        }
        else {
            deviceType = 'Phone';
        }
    }

    /**
     * @property {String} deviceType
     * The generic type of the current device.
     *
     * Possible values:
     *
     * - Phone
     * - Tablet
     * - Desktop
     *
     * For testing purposes the deviceType can be overridden by adding
     * a deviceType parameter to the URL of the page, like so:
     *
     *     http://localhost/mypage.html?deviceType=Tablet
     *
     * @member ST.os
     */
    osEnv.setFlag(deviceType, true);
    osEnv.deviceType = deviceType;

    delete OS.prototype.flags;
});
