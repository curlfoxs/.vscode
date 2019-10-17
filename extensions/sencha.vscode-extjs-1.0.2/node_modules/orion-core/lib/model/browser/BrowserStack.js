'use strict';

const Browser = require('./Browser');
const Version = require('orion-core/lib/Version');

class BrowserStack extends Browser {
    
    get browser() {
        return this.data.browser;
    }
    
    get browser_version() {
        return this.data.browser_version;
    }
    
    get os() {
        return this.data.os;
    }
    
    get displayOS() {
        return this.os;
    }
    
    get os_version() {
        return this.data.os_version;
    }
    
    get device() {
        return this.data.device;
    }
    
    get canonicalName() {
        var me = this;
        return me.getCanonicalName(me.data.browser);
    }
    
    get canonicalPlatform() {
        var me = this;
        return me.getCanonicalPlatform(me.data.os || me.data.platform);
    }
    
    get parsedVersion() {
        var data = this.data,
            rawVersion = data.browser_version;
        return rawVersion != null ? new Version(rawVersion) : null;
    }
    
    set parsedVersion(value) { 
        if (value && !value.isVersion) {
            value = new Version(value);
        }
        this.data.browser_version = value;
    }
    
    get displayName() {
        var me = this;
        return me.getDisplayName(me.canonicalName) || me.data.browser || me.data.browserName;
    }
    
    get displayPlatform() {
        var me = this,
            data = me.data,
            os = data.os,
            osVersion = data.os_version,
            platform = data.platform,
            ret;
        
        if (os) {
            ret = os;
            if (osVersion) {
                ret += ' ' + osVersion;
            }
        } else if (platform) {
            ret = platform;
        }
        
        return ret;
    }
    
    get displayDevice() {
        var me = this;
        return me.data.device;
    }
    
}

module.exports = BrowserStack;
