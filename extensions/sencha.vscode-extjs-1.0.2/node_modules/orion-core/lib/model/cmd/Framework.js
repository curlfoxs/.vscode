"use strict";

var Entity = require('../Entity.js');
var Configuration = require('../../config/Configuration');
var Package = require('./Package');
var Testable = require('../Testable');

/**
 * This class manages an Application definition.
 */
class Framework extends Package {
    static get meta () {
        return {
            prototype: {
                isFramework: true
            }
        };
    }

    getName () {
        var data = this.data;

        if (data) {
            return data.summary + ' ' + data.version;
        }

        return super.getName();
    }

    resolveVariables (path) {
        return super.resolveVariables(path).split('${framework.dir}').join(this.dir);
    }

    setSourceFile (path) {
        if (this.data.dependencies) {
            throw new Error('Not a valid Sencha Framework: ' + path);
        }

        return super.setSourceFile(path);
    }

    //-------------------------------------------------------------------
    // Static

    static get configPath () { return 'cmd/sencha.cfg'; }

    static get kind () { return 'Framework'; }

    static load (dir, owner, deep) {
        if (typeof owner === 'boolean') {
            deep = owner;
            owner = null;
        }

        return new Promise(function (resolve, reject) {
            var config = new Configuration();

            Entity.load.call(Framework, dir, owner, deep).then(function (framework) {
                if (!framework.error) {
                    resolve(framework);
                }
                else {
                    // Framework: Less than Ext JS 5 so
                    // check for Ext JS 4.1.1+ and Sencha Touch 2.1+
                    //
                    var file = dir + '/cmd/sencha.cfg';

                    config.load(file).then(function () {
                        var name = config.get('framework.name'),
                            ext = (name === 'ext'),
                            summary = ext ? 'Ext JS' : 'Sencha Touch';

                        var framework = new Framework({
                            name: name,
                            type: 'framework',
                            namespace: 'Ext',
                            classpath: config.get('framework.classpath'),
                            creator: 'Sencha',
                            summary: summary,
                            detailedDescription: (ext ? 'Sencha Ext JS' : summary) + ' JavaScript Framework',
                            version: config.get('framework.version')
                        });

                        if (owner) {
                            framework.setOwner(owner);
                        }
                        framework.path = file;
                        framework.dir = dir;

                        resolve(framework);
                    }, function (e) {
                        var framework = new Framework();

                        framework.dir = dir;
                        framework.error = e;
                        framework.relativePath = dir;

                        resolve(framework);
                    });
                }
            });
        });
    }
}

module.exports = Framework;
