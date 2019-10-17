'use strict';

class Version {
    constructor (ver) {
        var me = this,
            parts, type;

        if (ver.isVersion) {
            me.parts = ver.parts.slice();
            me.version = ver.version;
        }
        else {
            type = typeof ver;

            if (type === 'string') {
                parts = ver.split(/\./);
            }
            else if (type === 'number') {
                parts = [ ver = String(ver) ];
            }
            else if (Array.isArray(ver)) {
                parts = ver;
                ver = parts.join('.');
            }
            else {
                parts = [ ver ];
            }

            me.parts = [];
            me.version = ver;

            parts.forEach(function (v) {
                me.parts.push(parseInt(v, 10));
            });
        }

        parts = me.parts;

        me.major = parts[0] || 0;
        me.minor = parts[1] || 0;
        me.patch = parts[2] || 0;
        me.build = parts[3] || 0;

        me.shortVersion = parts.join('');
    }

    compareTo (ver, parts) {
        return Version.compare(this, ver, parts);
    }

    le (ver) {
        return this.compareTo(ver) <= 0;
    }

    lt (ver) {
        return this.compareTo(ver) < 0;
    }

    ge (ver) {
        return this.compareTo(ver) >= 0;
    }

    gt (ver) {
        return this.compareTo(ver) > 0;
    }

    eq (ver) {
        return this.compareTo(ver) === 0;
    }

    toString() {
        return this.parts.join('.');
    }

    shortString () {
        return this.major + '.' + this.minor;
    }

    static from (ver) {
        if (ver && ver.isVersion) {
            return ver;
        }

        return new Version(ver);
    }

    static compare (v1, v2, parts) {
        v1 = Version.from(v1);
        v2 = Version.from(v2);

        var a = v1.parts,
            b = v2.parts,
            len = parts || Math.max(a.length, b.length),
            delta = 0,
            i;

        for (i = 0; !delta && i < len; i++) {
            delta = (a[i] || 0) - (b[i] || 0);
            if (delta !== 0) {
                return delta;
            }
        }
        return 0;
    }
}

Version.prototype.isVersion = true;

Version.ZERO = new Version('0');

module.exports = Version;
