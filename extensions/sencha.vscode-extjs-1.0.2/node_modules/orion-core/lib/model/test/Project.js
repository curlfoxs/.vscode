"use strict";

var WorkspaceMember = require('../WorkspaceMember');
var Scenario = require('./Scenario');
var Url = require('url');
var urlParse = Url.parse;
var Path = require('path');
var TargetUrl = require('../TargetUrl');
const File = require('orion-core/lib/fs/File');

/**
 * This class manages a Test Project definition.
 *
 * For example:
 *
 *      {
 *          "libs": [
 *              "lib/jasmine-2.0.3/jasmine.js",
 *              "lib/jasmine-2.0.3/jasmine-sencha.js",
 *              "lib/jasmine-2.0.3/boot.js"
 *          ],
 *          "scenarios": [{
 *              "name": "Scenario 1",
 *              "page": "../index-test.html",
 *              "directory": "scenario1",
 *              "launch": false,
 *              "libs": [
 *                  "lib/some_extra-lib.js"
 *              ]
 *          }, {
 *              "name": "Scenario 2",
 *              "page": "../index-test.html",
 *              "directory": "scenario2"
 *          }]
 *      }
 */
class Project extends WorkspaceMember {
    static get meta () {
        return {
            mixins: [
                TargetUrl
            ]
        };
    }

    ctor () {
        var me = this,
            data = me.data,
            libs = data.libs,
            coverageFilters = data.coverageFilters,
            i, lib;

        data.framework = data.framework || 'jasmine';
        data.libs = libs || (libs = []);
        data.coverageFilters = coverageFilters || (coverageFilters = []);

        me.scenarios = [];

        for (i = libs.length; i-- > 0; ) {
            lib = libs[i];

            if (typeof lib === 'string') {
                libs[i] = {
                    path: lib
                };
            }
        }

        if (data.scenarios) {
            data.scenarios.forEach(function(def) {
                me.scenarios.push(new Scenario(def, me));
            });
        } else {
            data.scenarios = [];
        }
    }

    launchAppWatch () {
        return !!this.get('launchAppWatch');
    }

    addScenario (def) {
        var scenario = new Scenario(def, this);

        this.scenarios.push(scenario);
        return scenario;
    }

    eachScenario (fn, scope) {
        var scenarios = this.scenarios,
            length = scenarios.length,
            i;

        for (i = 0; i < length; ++i) {
            if (fn.call(scope, scenarios[i]) === false) {
                break;
            }
        }
    }

    getTestFramework () {
        var framework = this.get('framework');

        return framework || null;
    }

    getOwner () {
        var owner = this.owner;
        if (owner.isWorkspace && owner.isSoloApp()) {
            return owner.apps[0]
        }
        return owner;
    }

    getTargetUrl (profile, scenario) {
        var me = this,
            subjectUrl = me.get('subjectUrl'),
            owner = me.getOwner(),
            ownerTarget = owner && owner.getTargetUrl && owner.getTargetUrl(profile, scenario),
            parsed;

        if (subjectUrl) {
            parsed = urlParse(subjectUrl);
            if (parsed.hostname) {
                return subjectUrl;
            }
        }
        return [ownerTarget, subjectUrl].filter(function(item){
            return !!item;
        }).join('');
    }

    getWorkspaceMountDir () {
        return this.data.workspaceMountDir || this.getWorkspace().dir;
    }

    getScenarioFromPath (deepPath) {
        var file = File.get(deepPath),
            scenarios = this.scenarios,
            i, scenario, scenarioDir;

        for (i = 0; i < scenarios.length; i++) {
            scenario = scenarios[i];
            scenarioDir = File.get(this.resolve(scenario.get('directory')));
            if (scenarioDir.contains(file) || scenarioDir.equals(file)) {
                return scenario;
            }
        }

        return null;
    }

    static get defaultDir () { return 'test'; }

    static get jsonName () { return 'project.json'; }

    static get kind () { return 'Test Project'; }

    get isTestProject () { return true; }
}

module.exports = Project;
