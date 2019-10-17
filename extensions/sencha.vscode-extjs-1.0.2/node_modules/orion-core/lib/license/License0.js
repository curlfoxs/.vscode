'use strict';

const License = require('orion-core/lib/license/License');

const TRIAL_REGEXP = /trial/i;

/**
 * @class core.license.License0
 * @extend core.license.License
 *
 * Format:
 *
 *      {
 *          "Expires": "2035-01-07T11:40:38",
 *          "Print": "132jeA2kI5ZEnJAFxYYiXDJ+zQs=|9kU9b4RQGz4gnP2KL/HqtE7uc8Q=",
 *          "Product": "Sencha Test 1.x License",
 *          "Signature": "kbPrKyl0q6jCRgqjWtoK5Hx...",
 *          "Username": "user@sencha.com"
 *      }
 */
class License0 extends License {
    static get meta () {
        return {
            prototype: {
                signFields: [
                    'Product',
                    'Username',
                    'Print',
                    'Expires'
                ]
            },

            statics: {
                schemaVersion: 0
            }
        };
    }

    ctor () {
        this.data.id = this.data.Signature;
    }

    static grok (data) {
        return !!data.Username || data.schema === 0;
    }

    get email () {
        return this.data.Username;
    }

    get expiration () {
        var expiration = this.data.Expires || null;

        return expiration && Date.parse(expiration);
    }
    
    get fingerprint () {
        return this.data.Print;
    }
    
    get product () {
        var data = this.data;
        return data.product || data.Product;
    }
    
    get signature () {
        return this.data.Signature;
    }

    get trial () {
        return TRIAL_REGEXP.test(this.data.Product);
    }

    getSignData () {
        var data = this.serialize(), // we need to get Product corrected
            pairs = [],
            ret = '',
            keys = this.signFields,
            key;

        for (key in data) {
            if (data.hasOwnProperty(key) && keys.indexOf(key) !== -1) {
                pairs.push([ key, data[key] ]);
            }
        }

        pairs.sort();
        pairs.forEach(function (pair) {
            ret += pair[1];
        });

        return ret;
    }

    serialize () {
        var data = this.data;

        return {
            Expires: data.Expires,
            Print: data.Print,
            Product: data.Product,
            Signature: data.Signature,
            Username: data.Username
        };
    }
}

module.exports = License0;
