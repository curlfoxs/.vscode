'use strict';

var Observable = require('orion-core/lib/Observable');

class Instance extends Observable {

    constructor (browser, instance) {
        super();
        this.browser = browser;
        this.instance = instance;
        this.instance.on('stop', function(){
            this.fire('stopped');
        }.bind(this));
    }

    stop () {
        var me = this;
        return new Promise(function(resolve, reject){
            if (me.instance) {
                me.instance.stop(function(){
                    resolve(me);
                });
            } else {
                reject('no instance');
            }
        }).then(function(browser){
            me.browser.instances.remove(me);
            return browser;
        });
    }
}

module.exports = Instance;