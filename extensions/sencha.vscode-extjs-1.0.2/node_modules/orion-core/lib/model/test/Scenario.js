"use strict";

var Entity = require('../Entity');

var Path = require('path');
var xfs = require('../../xfs');
var Url = require('url');
var urlParse = Url.parse;
var TargetUrl = require('../TargetUrl');

/**
 * This class manages a Test Scenario definition.
 */
class Scenario extends Entity {
    static get meta () {
        return {
            mixins: [
                TargetUrl
            ]
        };
    }

    constructor (data, project) {
        super(data);

        var me = this,
            data = me.data, // get value since data may be null and this.data was created
            libs = data.libs || (data.libs = []),
            coverageFilters = data.coverageFilters || (data.coverageFilters = []),
            i = libs.length,
            lib;

        me.project = project;

        me.name = data.name;  // hoist this up for convenience

        while (i-- > 0) {
            lib = libs[i];

            if (typeof lib === 'string') {
                libs[i] = {
                    path: lib
                };
            }
        }
    }

    get dir() {
        return this.project.resolve(this.data.directory);
    }
    
    getGlobals () {
        var globals = this.project.get('globals') || '',
            more = this.get('globals') || '',
            i;

        globals = globals.trim() + '\n' + more.trim();
        globals = globals.split('\n');

        for (i = globals.length; i-- > 0; ) {
            if (!(globals[i] = globals[i].trim())) {
                globals.splice(i, 1);
            }
        }

        return globals;
    }

    getTestFramework () {
        var framework = this.get('framework'),
            project = this.project;

        if (!framework && project) {
            framework = project.getTestFramework();
        }

        return framework || null;
    }

    getTestPath () {
        return Path.join(this.project.dir, this.data.directory);
    }

    getFiles () {
        var me = this,
            dir = me.getTestPath(),
            files = me.files,
            allFiles, walk;

        allFiles = xfs.listAllFilesSync(dir);
        files = me.files = [];
        walk = function(file, files) {
            if (file.stat.isDirectory()) {
                file.items.forEach(function(item){
                    walk(item, files);
                })
            } else if (file.path.endsWith('.js')) {
                files.push(file.path);
            }
        };
        allFiles.forEach(function(file) {
            walk(file, files);
        });

        return files;
    }

    getLibs (pathPrefix) {
        var me = this,
            libs = [],
            ret = [],
            projLibs = me.project.data.libs,
            scenarioLibs = me.data.libs,
            baseUrl = 'http://foo.com' + me.project.getWorkspaceRelativePath();

        if (projLibs && projLibs.length) {
            libs.push.apply(libs, projLibs);
        }

        if (scenarioLibs && scenarioLibs.length) {
            libs.push.apply(libs, scenarioLibs);
        }

        libs.forEach(function (lib) {
            var path = lib, s;

            if (lib && (typeof lib === 'string' || (!lib.disabled && (path = lib.path)))) {
                if (path.indexOf('://') < 0) {
                    s = Url.resolve(baseUrl, path);
                    s = Url.parse(s);
                    path = (pathPrefix || '') + s.pathname;
                }

                ret.push(path);
            }
        });

        return ret;
    }

    getTargetUrl () {
        var me = this,
            page = me.get('page'),
            project = me.project,
            parsed = urlParse(page || '');

        if (parsed.hostname) {
            return page;
        }

        return [project.getTargetUrl(me.get('profile'), me), page].filter(function(item) {
            return !!item;
        }).join('');
    }
}

module.exports = Scenario;
