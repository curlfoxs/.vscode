'use strict';

const Browser = require('./Browser');
const Version = require('orion-core/lib/Version');

class SauceLabs extends Browser {
    
    get browserName() {
        return this.data.browserName;
    }
    
    get version() {
        return this.data.version;
    }
    
    get platform() {
        return this.data.platform;
    }
    
    get canonicalName() {
        var me = this;
        return me.getCanonicalName(me.data.browserName);
    }
    
    get canonicalPlatform() {
        var me = this,
            data = me.data;
        return me.getCanonicalPlatform(data.platformName || data.platform);
    }
    
    get displayName() {
        var me = this;
        return me.getDisplayName(me.canonicalName) || me.data.browserName;
    }
    
    get displayVersion() {
        var data = this.data;
        return data.platformVersion || data.version;
    }
    
    get displayPlatform() {
        var data = this.data,
            platformName = data.platformName,
            platformVersion = data.platformVersion;
        
        if (platformName) {
            let ret = platformName;
            if (platformVersion) {
                ret += ' ' + platformVersion; 
            }
            return ret;
        }
        
        return this.data.platform;
    }
    
    get displayDevice() {
        return this.data.deviceName;
    }
    
}

module.exports = SauceLabs;
