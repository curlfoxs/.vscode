"use strict";

var Entity = require('orion-core/lib/model/Entity');
var Browser = require('orion-core/lib/model/browser/Browser');
var Json = require('orion-core/lib/Json');

class Pool extends Entity {
    /**
     * @cfg {model.Farm} farm
     * The farm that this pool belongs to.
     */

    ctor () {
        this.id = Pool.nextId();
        this.browsers = [];
    }
    
    get name() {
        return this.data.name;
    }
    
    get browserClass() {
        return this.farm.browserClass;
    }

    /**
     * Adds a browser to this pool
     * @param {Browser} browser
     */
    add (browser) {
        if (!browser.isBrowser) {
            browser = new Browser(browser);
        }

        this.browsers.push(browser);
        browser.pool = this;
    }

    getBrowsers() {
        return Promise.resolve(this.browsers);
    }

    getPersistData () {
        var ret = [];

        this.browsers.forEach(function (browser) {
            if (browser.canPersist()) {
                ret.push(browser.data);
            }
        });

        return ret;
    }

    loadConfigFile () {
        var me = this,
            path = me.farm.workspace.resolve(me.data.path),
            BrowserType = me.farm.browserClass;

        return Json.read(path).then(function(capabilitiesList) {
            if (capabilitiesList) {
                me.setSourceFile(path);

                capabilitiesList.forEach(function(capabilities) {
                    // Convert chunks to sencha.concurrency. Will write back if user edit/save the pool.
                    var sencha = capabilities.sencha || (capabilities.sencha = {});
                    sencha.concurrency = sencha.concurrency || capabilities.chunks || 1;
                    delete capabilities.chunks;
                    
                    me.add(new BrowserType(capabilities));
                });
            }
            return me;
        }, function (err) {
            //TODO display these nodes properly and allow save of them
            //me.error = err;
            return me;
        });
    }

    remove (browser) {
        var browsers = this.browsers,
            index = browser;

        if (typeof browser === 'number') {
            browser = browsers[index];
        } else {
            index = browsers.indexOf(browser);
        }

        if (index >= 0) {
            if (index < browsers.length - 1) {
                browsers.splice(index, 1);
            } else {
                browsers.pop();
            }

            browser.pool = null;
        }

        return browser;
    }

    save () {
        var me = this;

        if (!me.sourceFile) {
            me.setSourceFile(me.farm.workspace.resolve(me.data.path));
        }

        return super.save();
    }

    sync (browsers) {
        var me = this,
            count = me.browsers.length;

        while (count-- > 0) {
            me.remove(me.browsers[count]);
        }

        browsers.forEach(me.add, me);
    }
}

module.exports = Pool;
