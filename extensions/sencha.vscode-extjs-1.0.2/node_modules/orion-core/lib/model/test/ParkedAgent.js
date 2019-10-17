"use strict";

class ParkedAgent {
    getRedirectUrl () {
        var me = this;

        return new Promise(function(resolve, reject){
            function complete(config){
                resolve(config);
            }

            me._responseHandler = function(config){
                clearTimeout(me._flushTimeoutId);
                me._flushTimeoutId = null;
                complete(config);
            };
            me._flushTimeoutId = setTimeout(me._responseHandler, 25000);
        });
    }

    /**
     * Redirects the agent to a url, or a port/page relative to existing location.origin
     * @param {Object} config
     * @param {String} [config.url]
     * @param {String} [config.port]
     * @param {String} [config.page
     */
    redirectTo (config) {
        this._responseHandler(config);
    }

    destroy () {
        this.destroyed = true;
    }
}

module.exports = ParkedAgent;
