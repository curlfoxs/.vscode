'use strict';

const Settings = require('./Settings');

class AppSettings extends Settings {
    static get meta () {
        return {
            prototype: {
                defaults: {
                    width     : 1000,
                    height    : 600,
                    maximized : false,
                    stats     : true
                },

                validators: {
                    height: function (v) {
                        return v && typeof v === 'number' && v > 600 ? v : this.defaults.height;
                    },
                    width: function (v) {
                        return v && typeof v === 'number' && v > 1000 ? v : this.defaults.width;
                    },
                    stats: function (v) {
                        return !!v;
                    }
                }
            }
        };
    }
}

module.exports = AppSettings;
