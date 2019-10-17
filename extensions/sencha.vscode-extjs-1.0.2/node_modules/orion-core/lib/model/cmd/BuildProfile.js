'use strict';

var Observable = require('../../Observable');
var File = require('orion-core/lib/fs/File');
var Json = require('orion-core/lib/Json');
var appJsTemplate = new File(__dirname).join('app.js.handlebars');

class BuildProfile extends Observable {

    ctor () {
        var me = this;
        Object.assign(me, {
            displayName: me.name || 'default',
            watching: false,
            building: false,
            rootUrl: null,
            watchTask: null,
            type: me.owner.isApp ? 'app' : 'package',
            displayType: me.owner.isApp ? 'App' : 'Package',
            tasks: {}
        });
    }

    getBuildCommand (type, cmd, environment, clean) {
        return [
            type, // 'app' or 'package'
            cmd,  // 'build' or 'watch'
            clean
                ? '-clean'
                : null,
            this.name,
            environment
        ].filter(function(item) {
            return !!item;
        });
    }

    _buildLogMessage (event, task) {
        var me = this,
            msg = event.message.message,
            bootstrapMessage = 'Writing content to ',
            appendingMessage = 'Appending content to ';
        if (msg) {
            // the first writing content message is to the manifest file
            // which we need to track to use to build the unit test manifest
            if (msg.startsWith(bootstrapMessage) && !me.bootstrapFile) {
                var file = msg.substring(bootstrapMessage.length);
                if (file.endsWith('.json')) {
                    me.bootstrapFile = file;
                }
            }
            else if (!me.bootstrapFile && msg.startsWith(appendingMessage)) {
                var file = msg.substring(appendingMessage.length);
                if (file.endsWith('.json')) {
                    me.bootstrapFile = file;
                }
            }
        }
    }

    _watchLogMessage (event, task) {
        var me = this,
            msg = event.message.message,
            idleMessage = 'Waiting for changes...',
            urlMessage = 'Application available at ';

        if (msg) {
            if(msg.startsWith(idleMessage)) {
                me.building = false;
                me.fire({
                    type: 'watchIdle',
                    task: task,
                    profile: me
                });
                me._buildUnitTestFiles();
                me.bootstrapFile = null;
            } else {
                me.building = true;
                me.fire({
                    type: 'watchBuild',
                    task: task,
                    profile: me
                });
            }

            if (msg.startsWith(urlMessage)) {
                var url = msg.substring(urlMessage.length);
                if (!url.endsWith('/')) {
                    url += '/';
                }
                me.rootUrl = url;
                me.fire({
                    type: 'rootUrl',
                    url: url,
                    profile: me
                });
            }
        }
    }

    _resetWatchStatus () {
        Object.assign(this, {
            watchStarted: false,
            watching: false,
            building: false,
            watchTask: null,
            rootUrl: null
        });
    }

    setBuildTask (task, skipCompleteTrigger) {
        var me = this;
        task.on({
            scope: this,
            complete: function(event) {
                if (!skipCompleteTrigger) {
                    me._buildUnitTestFiles();
                }
                me.bootstrapFile = null;
            },
            logMessage: function(event) {
                me._buildLogMessage(event, task);
            }
        });
    }

    setWatchTask (task) {
        var me = this;
        me.watchTask = task;
        me.watching = true;
        me.fire({
            type: 'watchStarted',
            task: task,
            profile: me
        });
        task.on({
            scope: me,
            complete: function(event) {
                me._resetWatchStatus();
                me.fire({
                    type: 'watchDone',
                    task: task,
                    profile: me
                });
            },
            logMessage: function(event) {
                me._watchLogMessage(event, task);
            }
        });
        me.setBuildTask(task, true);
    }

    _getAppJsFile(profile) {
        return this.owner._getBuildDir(profile).join('app.js');
    }

    _extractAppJs () {
        var me = this,
            owner = me.owner,
            buildName = me.name;
        return owner._extractTemplate(appJsTemplate, me._getAppJsFile(buildName), buildName);
    }

    /**
     * Gets called on completion of "test build" in Runner.
     * Calls CodeBase._extractBuildIndex() and uses handlebars to generate our special index.html file
     * with our test hooks and what-not.
     * @private
     */
    _buildUnitTestFiles () {
        var me = this,
            owner = me.owner,
            buildName = me.name,
            jsonFile = me.bootstrapFile,
            buildDir = owner._getBuildDir(buildName),
            errHandler = function(err){
                console.error(err.stack || err);
            };

        if (jsonFile) {
            owner._extractBuildIndex(buildName).then(function(indexFile){
                me._extractAppJs().then(function(appJsFile){
                    Json.read(jsonFile).then(function(manifest){
                        var outFile = new File(owner._getBuildDir(buildName)).join('manifest.json'),
                            dir = new File(owner.dir),
                            configJs = owner.data.js,
                            bundleMap = {},
                            js = manifest.js,
                            css = manifest.css,
                            paths = manifest.paths,
                            newJs = [],
                            insertIdx = -1,
                            idx = 0,
                            loadOrderAdded = false,
                            loadOrder = manifest.loadOrder,
                            loadOrderJs = [],
                            relPath;

                        relPath = dir.relativeTo(indexFile.getParent()).slashify() + '/';

                        if (configJs && configJs.length) {
                            configJs.forEach(function(js){
                                if (js.bundle) {
                                    var file = dir.join(js.path);
                                    bundleMap[file.getCanonicalPath()] = js;
                                }
                            });
                        }


                        js.forEach(function(js){
                            if (!js.remote) {
                                var file = dir.join(js.path);
                                if (bundleMap[file.getCanonicalPath()]) {
                                    if (!loadOrderAdded) {
                                        loadOrderAdded = true;
                                        insertIdx = idx;
                                    }
                                    return;
                                }
                            }
                            newJs.push(js);
                            idx++;
                        });

                        if (loadOrder && loadOrder.length) {
                            var len = loadOrder.length;
                            for (var i = 0; i < len; i++) {
                                var item = loadOrder[i],
                                    file = dir.join(item.path);

                                if (bundleMap[file.getCanonicalPath()]) {
                                    if (item.path.endsWith('app.js')) {
                                        loadOrderJs.push({
                                            path: relPath + 'app.js',
                                        });
                                        loadOrder.push({
                                            idx: loadOrder.length,
                                            path: relPath + 'app.js',
                                            requires: item.requires,
                                            uses: item.uses
                                        });
                                    }
                                }
                            }
                        }
                        else {
                            loadOrderJs.push({
                                path: relPath + 'app.js'
                            });
                        }

                        if (insertIdx > -1) {
                            newJs.splice.apply(newJs, [insertIdx, 0].concat(loadOrderJs));
                        }
                        else {
                            newJs.push.apply(newJs, loadOrderJs);
                        }

                        manifest.js = newJs;
                        //manifest.loadOrder = null;

                        outFile.write(JSON.stringify(manifest));
                        dir.join('.sencha/app/Boot.js').read().then(function(bootData){
                            dir.join('.sencha/app/Microloader.js').read().then(function(microloaderData){
                                buildDir.join('bootstrap.js').write(bootData + '\n' + microloaderData);
                            }, errHandler);
                        }, errHandler);
                    }, errHandler);
                }, errHandler);
            }, errHandler);
        }
    }
}

module.exports = BuildProfile;