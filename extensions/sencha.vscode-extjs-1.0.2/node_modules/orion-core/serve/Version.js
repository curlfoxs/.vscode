/**
 * @class ST.Version
 *
 * A utility class that wraps around a version number string and provides convenient methods
 * to perform comparisons. A version number is expressed in the following general format:
 *
 *     major[.minor[.patch[.build[release]]]]
 *
 * The `Version` instance holds various readonly properties that contain the digested form
 * of the version string. The numeric componnets of `major`, `minor`, `patch` and `build`
 * as well as the textual suffix called `release`.
 *
 * Not depicted in the above syntax are three possible prefixes used to control partial
 * matching. These are '^' (the default), '>' and '~'. These are discussed below.
 *
 * Examples:
 *
 *     var version = new ST.Version('1.0.2beta'); // or maybe "1.0" or "1.2.3.4RC"
 *     console.log("Version is " + version); // Version is 1.0.2beta
 *
 *     console.log(version.getMajor()); // 1
 *     console.log(version.getMinor()); // 0
 *     console.log(version.getPatch()); // 2
 *     console.log(version.getBuild()); // 0
 *     console.log(version.getRelease()); // beta
 *
 * The understood values of `release` are assigned numberic equivalents for the sake of
 * comparsion. The order of these from smallest to largest is as follows:
 *
 *  * `"dev"`
 *  * `"alpha"` or `"a"`
 *  * `"beta"` or `"b"`
 *  * `"RC"` or `"rc"`
 *  * `"#"`
 *  * `"pl"` or `"p"`
 *
 * Any other (unrecognized) suffix is consider greater than any of these.
 *
 * ## Comparisons
 * There are two forms of comparison that are commonly needed: full and partial. Full
 * comparison is simpler and is also the default.
 *
 * Example:
 *
 *     var version = new ST.Version('1.0.2beta');
 *
 *     console.log(version.isGreaterThan('1.0.1')); // True
 *     console.log(version.isGreaterThan('1.0.2alpha')); // True
 *     console.log(version.isGreaterThan('1.0.2RC')); // False
 *     console.log(version.isGreaterThan('1.0.2')); // False
 *     console.log(version.isLessThan('1.0.2')); // True
 *
 *     console.log(version.match(1.0)); // True (using a Number)
 *     console.log(version.match('1.0.2')); // True (using a String)
 *
 * These comparisons are ultimately implemented by {@link ST.Version#compareTo compareTo}
 * which returns -1, 0 or 1 depending on whether the `Version' instance is less than, equal
 * to, or greater than the given "other" version.
 *
 * For example:
 *
 *      var n = version.compareTo('1.0.1');  // == 1  (because 1.0.2beta > 1.0.1)
 *
 *      n = version.compareTo('1.1');  // == -1
 *      n = version.compareTo(version); // == 0
 *
 * ### Partial Comparisons
 * By default, unspecified version number fields are filled with 0. In other words, the
 * version number fields are 0-padded on the right or a "lower bound". This produces the
 * most commonly used forms of comparsion:
 *
 *      var ver = new Version('4.2');
 *
 *      n = ver.compareTo('4.2.1'); // == -1  (4.2 promotes to 4.2.0 and is less than 4.2.1)
 *
 * There are two other ways to interpret comparisons of versions of different length. The
 * first of these is to change the padding on the right to be a large number (scuh as
 * Infinity) instead of 0. This has the effect of making the version an upper bound. For
 * example:
 *
 *      var ver = new Version('^4.2'); // NOTE: the '^' prefix used
 *
 *      n = ver.compareTo('4.3'); // == -1  (less than 4.3)
 *
 *      n = ver.compareTo('4.2'); // == 1   (greater than all 4.2's)
 *      n = ver.compareTo('4.2.1'); // == 1
 *      n = ver.compareTo('4.2.9'); // == 1
 *
 * The second way to interpret this comparison is to ignore the extra digits, making the
 * match a prefix match. For example:
 *
 *      var ver = new Version('~4.2'); // NOTE: the '~' prefix used
 *
 *      n = ver.compareTo('4.3'); // == -1
 *
 *      n = ver.compareTo('4.2'); // == 0
 *      n = ver.compareTo('4.2.1'); // == 0
 *
 * This final form can be useful when version numbers contain more components than are
 * important for certain comparisons. For example, the full version of Ext JS 4.2.1 is
 * "4.2.1.883" where 883 is the `build` number.
 *
 * This is how to create a "partial" `Version` and compare versions to it:
 *
 *      var version421ish = new Version('~4.2.1');
 *
 *      n = version421ish.compareTo('4.2.1.883'); // == 0
 *      n = version421ish.compareTo('4.2.1.2'); // == 0
 *      n = version421ish.compareTo('4.2.1'); // == 0
 *
 *      n = version421ish.compareTo('4.2'); // == 1
 *
 * In the above example, '4.2.1.2' compares as equal to '4.2.1' because digits beyond the
 * given "4.2.1" are ignored. However, '4.2' is less than the '4.2.1' prefix; its missing
 * digit is filled with 0.
 */
ST.Version = ST.define(function (Version) {
    var // used by checkVersion to avoid temp arrays:
        endOfVersionRe = /([^\d\.])/,
        notDigitsRe = /[^\d]/g,
        plusMinusRe = /[\-+]/g,
        underscoreRe = /_/g;

return {
    isVersion: true,

    constructor: function(version, defaultMode) {
        var me = this,
            padModes = me.padModes,
            ch, i, pad, parts, release, releaseStartIndex, ver;

        if (version.isVersion) {
            version = version.version;
        }

        me.version = ver = String(version).toLowerCase().
                                replace(underscoreRe, '.').replace(plusMinusRe, '');

        ch = ver.charAt(0);
        if (ch in padModes) {
            ver = ver.substring(1);
            pad = padModes[ch];
        } else {
            pad = defaultMode ? padModes[defaultMode] : 0; // careful - NaN is falsey!
        }
        me.pad = pad;

        releaseStartIndex = ver.search(endOfVersionRe);
        me.shortVersion = ver;

        if (releaseStartIndex !== -1) {
            me.release = release = ver.substr(releaseStartIndex, version.length);
            me.shortVersion = ver.substr(0, releaseStartIndex);

            if (Version.releaseValueMap) {
                release = Version.releaseValueMap[release] || release;
            }
        }

        me.releaseValue = release || pad;
        me.shortVersion = me.shortVersion.replace(notDigitsRe, '');

        /**
         * @property {Number[]} parts
         * The split array of version number components found in the version string.
         * For example, for "1.2.3", this would be `[1, 2, 3]`.
         * @readonly
         * @private
         */
        me.parts = parts = ver.split('.');
        for (i = parts.length; i--; ) {
            parts[i] = parseInt(parts[i], 10);
        }
        if (pad === Infinity) {
            // have to add this to the end to create an upper bound:
            parts.push(pad);
        }

        /**
         * @property {Number} major
         * The first numeric part of the version number string.
         * @readonly
         */
        me.major = parts[0] || pad;

        /**
         * @property {Number} [minor]
         * The second numeric part of the version number string.
         * @readonly
         */
        me.minor = parts[1] || pad;

        /**
         * @property {Number} [patch]
         * The third numeric part of the version number string.
         * @readonly
         */
        me.patch = parts[2] || pad;

        /**
         * @property {Number} [build]
         * The fourth numeric part of the version number string.
         * @readonly
         */
        me.build = parts[3] || pad;

        return me;
    },

    padModes: {
        '~': NaN,
        '^': Infinity
    },

    /**
     * @property {String} [release=""]
     * The release level. The following values are understood:
     *
     *  * `"dev"`
     *  * `"alpha"` or `"a"`
     *  * `"beta"` or `"b"`
     *  * `"RC"` or `"rc"`
     *  * `"#"`
     *  * `"pl"` or `"p"`
     * @readonly
     */
    release: '',

    /**
     * Compares this version instance to the specified `other` version.
     *
     * @param {String/Number/ST.Version} other The other version to which to compare.
     * @return {Number} -1 if this version is less than the target version, 1 if this
     * version is greater, and 0 if they are equal.
     */
    compareTo: function (other) {
         // "lhs" == "left-hand-side"
         // "rhs" == "right-hand-side"
        var me = this,
            lhsPad = me.pad,
            lhsParts = me.parts,
            lhsLength = lhsParts.length,
            rhsVersion = other.isVersion ? other : new Version(other),
            rhsPad = rhsVersion.pad,
            rhsParts = rhsVersion.parts,
            rhsLength = rhsParts.length,
            length = Math.max(lhsLength, rhsLength),
            i, lhs, rhs;

        for (i = 0; i < length; i++) {
            lhs = (i < lhsLength) ? lhsParts[i] : lhsPad;
            rhs = (i < rhsLength) ? rhsParts[i] : rhsPad;

            // When one or both of the values are NaN these tests produce false
            // and we end up treating NaN as equal to anything.
            if (lhs < rhs) {
                return -1;
            }
            if (lhs > rhs) {
                return 1;
            }
        }

        // same comments about NaN apply here...
        lhs = me.releaseValue;
        rhs = rhsVersion.releaseValue;
        if (lhs < rhs) {
            return -1;
        }
        if (lhs > rhs) {
            return 1;
        }

        return 0;
    },

    /**
     * Override the native `toString` method
     * @private
     * @return {String} version
     */
    toString: function() {
        return this.version;
    },

    /**
     * Override the native `valueOf` method
     * @private
     * @return {String} version
     */
    valueOf: function() {
        return this.version;
    },

    /**
     * Returns the major component value.
     * @return {Number}
     */
    getMajor: function() {
        return this.major;
    },

    /**
     * Returns the minor component value.
     * @return {Number}
     */
    getMinor: function() {
        return this.minor;
    },

    /**
     * Returns the patch component value.
     * @return {Number}
     */
    getPatch: function() {
        return this.patch;
    },

    /**
     * Returns the build component value.
     * @return {Number}
     */
    getBuild: function() {
        return this.build;
    },

    /**
     * Returns the release component text (e.g., "beta").
     * @return {String}
     */
    getRelease: function() {
        return this.release;
    },

    /**
     * Returns the release component value for comparison purposes.
     * @return {Number/String}
     */
    getReleaseValue: function() {
        return this.releaseValue;
    },

    /**
     * Returns whether this version if greater than the supplied argument
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version if greater than the target, `false` otherwise
     */
    isGreaterThan: function(target) {
        return this.compareTo(target) > 0;
    },

    /**
     * Returns whether this version if greater than or equal to the supplied argument
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version if greater than or equal to the target, `false` otherwise
     */
    isGreaterThanOrEqual: function(target) {
        return this.compareTo(target) >= 0;
    },

    /**
     * Returns whether this version if smaller than the supplied argument
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version if smaller than the target, `false` otherwise
     */
    isLessThan: function(target) {
        return this.compareTo(target) < 0;
    },

    /**
     * Returns whether this version if less than or equal to the supplied argument
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version if less than or equal to the target, `false` otherwise
     */
    isLessThanOrEqual: function(target) {
        return this.compareTo(target) <= 0;
    },

    /**
     * Returns whether this version equals to the supplied argument
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version equals to the target, `false` otherwise
     */
    equals: function(target) {
        return this.compareTo(target) === 0;
    },

    /**
     * Returns whether this version matches the supplied argument. Example:
     *
     *     var version = new ST.Version('1.0.2beta');
     *     console.log(version.match(1)); // true
     *     console.log(version.match(1.0)); // true
     *     console.log(version.match('1.0.2')); // true
     *     console.log(version.match('1.0.2RC')); // false
     *
     * @param {String/Number} target The version to compare with
     * @return {Boolean} `true` if this version matches the target, `false` otherwise
     */
    match: function(target) {
        target = String(target);
        return this.version.substr(0, target.length) === target;
    },

    /**
     * Returns this format: [major, minor, patch, build, release]. Useful for comparison.
     * @return {Number[]}
     */
    toArray: function() {
        var me = this;
        return [me.getMajor(), me.getMinor(), me.getPatch(), me.getBuild(), me.getRelease()];
    },

    /**
     * Returns shortVersion version without dots and release
     * @return {String}
     */
    getShortVersion: function() {
        return this.shortVersion;
    },

    /**
     * Convenient alias to {@link ST.Version#isGreaterThan isGreaterThan}
     * @param {String/Number/ST.Version} target
     * @return {Boolean}
     */
    gt: function (target) {
        return this.compareTo(target) > 0;
    },

    /**
     * Convenient alias to {@link ST.Version#isLessThan isLessThan}
     * @param {String/Number/ST.Version} target
     * @return {Boolean}
     */
    lt: function (target) {
        return this.compareTo(target) < 0;
    },

    /**
     * Convenient alias to {@link ST.Version#isGreaterThanOrEqual isGreaterThanOrEqual}
     * @param {String/Number/ST.Version} target
     * @return {Boolean}
     */
    gtEq: function (target) {
        return this.compareTo(target) >= 0;
    },

    /**
     * Convenient alias to {@link ST.Version#isLessThanOrEqual isLessThanOrEqual}
     * @param {String/Number/ST.Version} target
     * @return {Boolean}
     */
    ltEq: function (target) {
        return this.compareTo(target) <= 0;
    }
}});
