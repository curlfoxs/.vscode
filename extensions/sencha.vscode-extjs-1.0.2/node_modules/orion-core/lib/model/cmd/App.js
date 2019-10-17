"use strict";

var CodeBase = require('./CodeBase');
var Observable = require('../../Observable');
var http = require('http');
var Url = require('url');

/**
 * This class manages an Application definition.
 */
class App extends CodeBase {
    static get meta () {
        return {
            prototype: {
                isApp: true
            },
            mixins: [
                Observable
            ]
        };
    }

    ctor () {
        var me = this;
        Object.assign(this, {
            watchTasks: {},
            taskCount: 0,
            buildCount: 0
        });
        me.getBuildProfiles().forEach(function(profile){
            profile.on({
                scope: me,
                watchStarted: function(event){
                    me._onWatchTaskStarted(event.task, profile);
                },
                watchIdle: function(event){
                    me._onWatchIdle(event.task, profile);
                },
                watchBuild: function(event){
                    me._onWatchBuild(event.task, profile);
                },
                watchDone: function(event){
                    me._onWatchTaskDone(event.task, profile);
                }
            });
        });
    }

    /**
     *
     * @param cmdClient
     * @param buildName - if empty, null or undefined will use default build profile.
     * @returns {*}
     */
    startWatch (cmdClient, buildName) {
        var me = this,
            watchCount = me.watchCount || 1,
            profile = me.getBuildProfile(buildName),
            name = profile.displayName,
            description = me.getName() + ' App Watch ' + name + ' (' + watchCount + ')',
            watchStarted = profile && profile.watchStarted,
            dispatchCfg;

        if (!watchStarted) {
            profile.watchStarted = true;
            me.watchCount = watchCount + 1;
            me.cmdClient = cmdClient;

            dispatchCfg = me._getDispatchConfig(
                profile.getBuildCommand('app', 'watch'),
                description);

            return me._runDispatch(cmdClient, dispatchCfg).then(function(task){
                profile.setWatchTask(task);
                return task;
            });
        }
        return Promise.resolve(profile.watchTask);
    }

    _onWatchBuild (task) {
        var me = this;
        if (!task.rebuilding && !task.complete) {
            task.rebuilding = true;
            me.buildCount++;
            // TODO test stc usage...
            if (me.record) {
                me.record.addCls('app-watch-building');
            }
            me.fire('appWatchBuilding');
        }
    }

    _onWatchIdle (task) {
        var me = this;
        if (task.rebuilding) {
            task.rebuilding = false;
            me.buildCount--;
        }
        if (!me.buildCount) {
            if (me.record) {
                me.record.removeCls('app-watch-building');
            }
            me.fire('appWatchIdle');
        }
    }

    _onWatchTaskStarted (task) {
        var me = this;
        me.taskCount+=1;
        if ((me.taskCount === 1) && me.record) {
            me.record.addCls('app-watch-running app-watch-building');
        }
    }

    _onWatchTaskDone (task) {
        var me = this;
        me.taskCount-=1;
        if (!me.taskCount && me.record) {
            me.record.removeCls('app-watch-running app-watch-building')
        }
    }

    stopWatch (name) {
        var me = this,
            profile = me.getBuildProfile(name),
            task = profile && profile.watchTask;

        if (task) {
            task.stop();
        }
    }

    launch (profileName) {
        profileName = this.getProfileName(profileName);
        var me = this;
        return new Promise(function(resolve, reject){
            var profile = me.getBuildProfile(profileName);
            if (profile) {
                if (profile.rootUrl) {
                    resolve(profile.rootUrl);
                }
                else {
                    if (!profile.watchStarted) {
                        if (!me.cmdClient) {
                            reject('No Cmd client configured');
                            return;
                        }
                        else {
                            me.startWatch(me.cmdClient, profileName);
                        }
                    }
                    profile.on({
                        scope: me,
                        single: true,
                        rootUrl: function(event) {
                            resolve(event.url);
                        }
                    });
                }
            }
            else {
                reject('No build profile named "' + profileName + '"');
            }
        });
    }

    getTargetUrl (profile, scenario) {
        profile = this.getProfileName(profile); // this call fixes up the name... makes it '' if no profiles or profile not found.
        if (scenario) {
            return scenario.get("launch")
                ? super.getTargetUrl()
                : this.getGeneratedSubjectUrl(profile);
        }
        return super.getTargetUrl();
    }

    /**
     * Run a build for SenchaTest. Hooks in CodeBase.runBuild() will handle after-build generation of
     * index.html as appropriate to include jasmine/etc.
     *
     * @param cmdClient
     * @param buildName
     * @param skipSass
     * @param logHandler
     */
    runTestBuild (cmdClient, buildName, skipSass, logHandler) {
        buildName = this.getProfileName(buildName);
        var me = this;
        return new Promise(function(resolve, reject){
            me.runBuild(cmdClient || me.cmdClient, buildName, 'development').then(function(task){
                task.on({
                    scope: me,
                    complete: function(){
                        resolve(task);
                    }
                });
                if (logHandler) {
                    task.on({
                        scope: me,
                        logMessage: function(event) {
                            logHandler(event);
                        }
                    });
                }
                return task;
            }, reject);
        });
    }

    //-------------------------------------------------------------------
    // Static

    static get configPath () { return '.sencha/app/sencha.cfg'; }

    static get jsonName () { return 'app.json'; }

    static get kind () { return 'Application'; }
}

App.prototype.isApp = true;

module.exports = App;
