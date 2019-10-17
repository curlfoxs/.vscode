ST.userAgent = navigator.userAgent.toLowerCase();

/**
 * @class ST.Browser
 * Provides information about the browser.
 *
 * Should not be manually instantiated unless for unit-testing.
 * Access the global instance stored in {@link ST.browser} instead.
 */
ST.Browser = ST.define({
    /**
     * @property {Boolean} isChrome
     * True if the detected browser is Chrome.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isGecko
     * True if the detected browser uses the Gecko layout engine (e.g. Mozilla, Firefox).
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE
     * True if the detected browser is Internet Explorer.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE8
     * True if the detected browser is Internet Explorer 8.x.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE8m
     * True if the detected browser is Internet Explorer 8.x or lower.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE8p
     * True if the detected browser is Internet Explorer 8.x or higher.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE9
     * True if the detected browser is Internet Explorer 9.x.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE9m
     * True if the detected browser is Internet Explorer 9.x or lower.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE9p
     * True if the detected browser is Internet Explorer 9.x or higher.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE10
     * True if the detected browser is Internet Explorer 10.x.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE10m
     * True if the detected browser is Internet Explorer 10.x or lower.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE10p
     * True if the detected browser is Internet Explorer 10.x or higher.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE11
     * True if the detected browser is Internet Explorer 11.x.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE11m
     * True if the detected browser is Internet Explorer 11.x or lower.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isIE11p
     * True if the detected browser is Internet Explorer 11.x or higher.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isLinux
     * True if the detected platform is Linux.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isMac
     * True if the detected platform is Mac OS.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isOpera
     * True if the detected browser is Opera.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isSafari
     * True if the detected browser is Safari.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isWebKit
     * True if the detected browser uses WebKit.
     * @readonly
     * @member ST
     */

    /**
     * @property {Boolean} isWindows
     * True if the detected platform is Windows.
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} chromeVersion
     * The current version of Chrome (0 if the browser is not Chrome).
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} firefoxVersion
     * The current version of Firefox (0 if the browser is not Firefox).
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} ieVersion
     * The current version of IE (0 if the browser is not IE). This does not account
     * for the documentMode of the current page, which is factored into {@link #isIE8},
     * and {@link #isIE9}. Thus this is not always true:
     *
     *     ST.isIE8 == (ST.ieVersion == 8)
     *
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} operaVersion
     * The current version of Opera (0 if the browser is not Opera).
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} safariVersion
     * The current version of Safari (0 if the browser is not Safari).
     * @readonly
     * @member ST
     */

    /**
     * @property {Number} webKitVersion
     * The current version of WebKit (0 if the browser does not use WebKit).
     * @readonly
     * @member ST
     */

    constructor: function (userAgent, publish) {
        var me = this,
            browserPrefixes = me.browserPrefixes,
            browserNames = me.browserNames,
            enginePrefixes = me.enginePrefixes,
            engineNames = me.engineNames,
            browserMatch = userAgent.match(new RegExp('((?:' +
                    ST.getValues(browserPrefixes).join(')|(?:') + '))([\\w\\._]+)')),
            engineMatch = userAgent.match(new RegExp('((?:' +
                    ST.getValues(enginePrefixes).join(')|(?:') + '))([\\w\\._]+)')),
            browserName = browserNames.other,
            engineName = engineNames.other,
            browserVersion = '',
            engineVersion = '',
            majorVer = '',
            isWebView = false,
            i, prefix, mode, name, maxIEVersion;

        /**
         * @property {String}
         * Browser User Agent string.
         */
        me.userAgent = userAgent;

        /**
         * A "hybrid" property, can be either accessed as a method call, for example:
         *
         *     if (ST.browser.is('IE')) {
         *         // ...
         *     }
         *
         * Or as an object with Boolean properties, for example:
         *
         *     if (ST.browser.is.IE) {
         *         // ...
         *     }
         *
         * Versions can be conveniently checked as well. For example:
         *
         *     if (ST.browser.is.IE10) {
         *         // Equivalent to (ST.browser.is.IE && ST.browser.version.equals(10))
         *     }
         *
         * __Note:__ Only {@link ST.Version#getMajor major component}  and {@link ST.Version#getShortVersion simplified}
         * value of the version are available via direct property checking.
         *
         * Supported values are:
         *
         * - IE
         * - Firefox
         * - Safari
         * - Chrome
         * - Opera
         * - WebKit
         * - Gecko
         * - Presto
         * - Trident
         * - WebView
         * - Other
         *
         * @param {String} name The OS name to check.
         * @return {Boolean}
         */
        this.is = function (name) {
            // Since this function reference also acts as a map, we do not want it to be
            // shared between instances, so it is defined here, not on the prototype.
            return !!this.is[name];
        };

        // Edge has a userAgent with All browsers so we manage it separately
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240"
        if (/Edge\//.test(userAgent)) {
            browserMatch = userAgent.match(/(Edge\/)([\w.]+)/);
        }

        if (browserMatch) {
            browserName = browserNames[ST.getKey(browserPrefixes, browserMatch[1])];
            //<feature legacyBrowser>
            if (browserName === 'Safari' && /^Opera/.test(userAgent)) {
                // Prevent Opera 12 and earlier from being incorrectly reported as Safari
                browserName = 'Opera';
            }
            //</feature>
            browserVersion = new ST.Version(browserMatch[2]);
        }

        if (engineMatch) {
            engineName = engineNames[ST.getKey(enginePrefixes, engineMatch[1])];
            engineVersion = new ST.Version(engineMatch[2]);
        }

        if (engineName === 'Trident' && browserName !== 'IE') {
            browserName = 'IE';
            var version = userAgent.match(/.*rv:(\d+.\d+)/);
            if (version && version.length) {
                version = version[1];
                browserVersion = new ST.Version(version);
            }
        }

        // Facebook changes the userAgent when you view a website within their iOS app. For some reason, the strip out information
        // about the browser, so we have to detect that and fake it...
        if (userAgent.match(/FB/) && browserName === "Other") {
            browserName = browserNames.safari;
            engineName = engineNames.webkit;
        }

        if (userAgent.match(/Android.*Chrome/g)) {
            browserName = 'ChromeMobile';
        }

        if (userAgent.match(/OPR/)) {
            browserName = 'Opera';
            browserMatch = userAgent.match(/OPR\/(\d+.\d+)/);
            browserVersion = new ST.Version(browserMatch[1]);
        }

        ST.apply(this, {
            engineName: engineName,
            engineVersion: engineVersion,
            name: browserName,
            version: browserVersion
        });

        this.setFlag(browserName, true, publish); // e.g., ST.isIE

        if (browserVersion) {
            majorVer = browserVersion.getMajor() || '';
            //<feature legacyBrowser>
            if (me.is.IE) {
                majorVer = parseInt(majorVer, 10);
                mode = document.documentMode;

                // IE's Developer Tools allows switching of Browser Mode (userAgent) and
                // Document Mode (actual behavior) independently. While this makes no real
                // sense, the bottom line is that document.documentMode holds the key to
                // getting the proper "version" determined. That value is always 5 when in
                // Quirks Mode.

                if (mode === 7 || (majorVer === 7 && mode !== 8 && mode !== 9 && mode !== 10)) {
                    majorVer = 7;
                } else if (mode === 8 || (majorVer === 8 && mode !== 8 && mode !== 9 && mode !== 10)) {
                    majorVer = 8;
                } else if (mode === 9 || (majorVer === 9 && mode !== 7 && mode !== 8 && mode !== 10)) {
                    majorVer = 9;
                } else if (mode === 10 || (majorVer === 10 && mode !== 7 && mode !== 8 && mode !== 9)) {
                    majorVer = 10;
                } else if (mode === 11 || (majorVer === 11 && mode !== 7 && mode !== 8 && mode !== 9 && mode !== 10)) {
                    majorVer = 11;
                }

                maxIEVersion = Math.max(majorVer, 12);
                for (i = 7; i <= maxIEVersion; ++i) {
                    prefix = 'isIE' + i;
                    if (majorVer <= i) {
                        ST[prefix + 'm'] = true;
                    }

                    if (majorVer === i) {
                        ST[prefix] = true;
                    }

                    if (majorVer >= i) {
                        ST[prefix + 'p'] = true;
                    }
                }
            }

            if (me.is.Opera && parseInt(majorVer, 10) <= 12) {
                ST.isOpera12m = true;
            }
            //</feature>

            ST.chromeVersion = ST.isChrome ? majorVer : 0;
            ST.firefoxVersion = ST.isFirefox ? majorVer : 0;
            ST.ieVersion = ST.isIE ? majorVer : 0;
            ST.operaVersion = ST.isOpera ? majorVer : 0;
            ST.safariVersion = ST.isSafari ? majorVer : 0;
            ST.webKitVersion = ST.isWebKit ? majorVer : 0;

            this.setFlag(browserName + majorVer, true, publish); // ST.isIE10
            this.setFlag(browserName + browserVersion.getShortVersion());
        }

        for (i in browserNames) {
            if (browserNames.hasOwnProperty(i)) {
                name = browserNames[i];

                this.setFlag(name, browserName === name);
            }
        }

        this.setFlag(name);

        if (engineVersion) {
            this.setFlag(engineName + (engineVersion.getMajor() || ''));
            this.setFlag(engineName + engineVersion.getShortVersion());
        }

        for (i in engineNames) {
            if (engineNames.hasOwnProperty(i)) {
                name = engineNames[i];

                this.setFlag(name, engineName === name, publish);
            }
        }

        this.setFlag('Standalone', !!navigator.standalone);

        this.setFlag('Ripple', !!document.getElementById("tinyhippos-injected") && !ST.isEmpty(window.top.ripple));
        this.setFlag('WebWorks', !!window.blackberry);

        if (window.PhoneGap !== undefined || window.Cordova !== undefined || window.cordova !== undefined) {
            isWebView = true;
            this.setFlag('PhoneGap');
            this.setFlag('Cordova');
        }

        // Check if running in UIWebView
        if (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)(?!.*FBAN)/i.test(userAgent)) {
            isWebView = true;
        }

        // Flag to check if it we are in the WebView
        this.setFlag('WebView', isWebView);

        /**
         * @property {Boolean}
         * `true` if browser is using strict mode.
         */
        this.isStrict = ST.isStrict = document.compatMode === "CSS1Compat";

        /**
         * @property {Boolean}
         * `true` if page is running over SSL.
         */
        this.isSecure = ST.isSecure;

        // IE10Quirks, Chrome26Strict, etc.
        this.identity = browserName + majorVer + (this.isStrict ? 'Strict' : 'Quirks');
    },

    engineNames: {
        webkit: 'WebKit',
        gecko: 'Gecko',
        presto: 'Presto',
        trident: 'Trident',
        other: 'Other'
    },

    enginePrefixes: {
        webkit: 'AppleWebKit/',
        gecko: 'Gecko/',
        presto: 'Presto/',
        trident: 'Trident/'
    },

    styleDashPrefixes: {
        WebKit: '-webkit-',
        Gecko: '-moz-',
        Trident: '-ms-',
        Presto: '-o-',
        Other: ''
    },

    stylePrefixes: {
        WebKit: 'Webkit',
        Gecko: 'Moz',
        Trident: 'ms',
        Presto: 'O',
        Other: ''
    },

    propertyPrefixes: {
        WebKit: 'webkit',
        Gecko: 'moz',
        Trident: 'ms',
        Presto: 'o',
        Other: ''
    },

    browserPrefixes: {
        chrome: 'Chrome/',
        chromeMobile: 'CrMo/',
        chromeiOS: 'CriOS/',
        dolfin: 'Dolfin/',
        edge: 'Edge/',
        firefox: 'Firefox/',
        ie: 'MSIE ',
        opera: 'OPR/',
        safari: 'Version/',
        silk: 'Silk/',
        webosbrowser: 'wOSBrowser/'
    },

    browserNames: {
        chrome: 'Chrome',
        chromeMobile: 'ChromeMobile',
        chromeiOS: 'ChromeiOS',
        dolfin: 'Dolfin',
        edge: 'Edge',
        firefox: 'Firefox',
        ie: 'IE',
        opera: 'Opera',
        other: 'Other',
        safari: 'Safari',
        silk: 'Silk',
        webosbrowser: 'webOSBrowser'
    },

    // scope: ST.Browser.prototype

    /**
     * The full name of the current browser.
     * Possible values are:
     *
     * - IE
     * - Firefox
     * - Safari
     * - Chrome
     * - Opera
     * - Other
     * @type String
     * @readonly
     */
    name: null,

    /**
     * Refer to {@link ST.Version}.
     * @type ST.Version
     * @readonly
     */
    version: null,

    /**
     * The full name of the current browser's engine.
     * Possible values are:
     *
     * - WebKit
     * - Gecko
     * - Presto
     * - Trident
     * - Other
     * @type String
     * @readonly
     */
    engineName: null,

    /**
     * Refer to {@link ST.Version}.
     * @type ST.Version
     * @readonly
     */
    engineVersion: null,

    setFlag: function(name, value, publish) {
        if (value === undefined) {
            value = true;
        }

        this.is[name] = value;
        this.is[name.toLowerCase()] = value;
        if (publish) {
            ST['is' + name] = value;
        }

        return this;
    },

    getStyleDashPrefix: function() {
        return this.styleDashPrefixes[this.engineName];
    },

    getStylePrefix: function() {
        return this.stylePrefixes[this.engineName];
    },

    getVendorProperyName: function(name) {
        var prefix = this.propertyPrefixes[this.engineName];

        if (prefix.length > 0) {
            return prefix + ST.capitalize(name);
        }

        return name;
    },

    getPreferredTranslationMethod: function(config) {
        if (typeof config === 'object' && 'translationMethod' in config && config.translationMethod !== 'auto') {
            return config.translationMethod;
        } else {
            return 'csstransform';
        }
    }
});

/**
 * @class ST.browser
 * @extends ST.Browser
 * @singleton
 * Provides useful information about the current browser.
 *
 * Example:
 *
 *     if (ST.browser.is.IE) {
 *         // IE specific code here
 *     }
 *
 *     if (ST.browser.is.WebKit) {
 *         // WebKit specific code here
 *     }
 *
 *     console.log("Version " + ST.browser.version);
 *
 * For a full list of supported values, refer to {@link #is} property/method.
 *
 */
ST.browser = new ST.Browser(navigator.userAgent, true);
