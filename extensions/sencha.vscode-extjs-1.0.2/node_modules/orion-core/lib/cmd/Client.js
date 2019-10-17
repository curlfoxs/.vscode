'use strict';

var http = require('http'),
    Observable = require('../Observable'),
    CmdTask = require('./CmdTask'),
    CPTask = require('../tasks/ChildProcessTask'),
    TaskManager = require('../tasks/Manager'),
    fs = require('fs'),
    Util = require('orion-core/lib/Util');

class Client extends Observable {

    constructor (config) {
        super();
        var me = this;
        Object.assign(me, Object.assign({
            running: false,
            path: null,
            port: 1900,
            useService: true,
            tasks: {},
            _useProcessForExec: false,
            _useProcessforDispatch: false,
            _ready: false,
            _readyListeners: [],
            enableLaunch: true,
            maxMemSize: 1024,
            _handlers: {
                LogMessage: [{
                    dispatch: function(message){
                        var taskId = message.taskId,
                            task = TaskManager.getTask(taskId);

                        if (task) {
                            task.onLogMessage(message);
                        }
                    }
                }],
                AntEvent: [{
                    dispatch: function(message){
                        var taskId = message.taskId,
                            task = TaskManager.getTask(taskId);

                        if (task) {
                            task.onAntEvent(message);
                        }
                    }
                }],
                TaskUpdate: [{
                    dispatch: function(message){
                        var status = message.status,
                            task = me._getTask(status);

                        if (task) {
                            task.update(status);
                        }
                    }
                }]
            }
        }, config));
    }

    getPath() {
        var me = this;
        if (!me.path && me.directory) {
            var path = me.directory;
            path += '/sencha';

            if (path.charAt(1) === ':') { // if (on Windows)
                path += '.exe';
            }
            me.path = path;
        }
        return me.path;
    }

    start (port) {
        var me = this;

        port = port || me.port;
        me.port = port;

        if (!me.serviceTask && me.enableLaunch) {
            me._launch().then(function (task) {
                me.serviceTask = task;
                me.running = true;
                me.internal = true;
                task.on({
                    scope: me,
                    complete: function(){
                        me.running = false;
                        me.serviceTask = null;
                    }
                });
                me.fire('running');
            }).catch(function (err) {
                console.log("failed to start sencha cmd : " + err);
                me.serviceTask = null;
            });
        }
        if (!me._ready) {
            me._onReady(me._initServiceClient.bind(me));
            me._detectReady();
        }
    }

    _launch() {
        var me = this,
            path = me.getPath();

        return new Promise(function (resolve, reject) {
            try {
                fs.access(path, fs.F_OK, function (err) {
                    if (!err) {
                        var task = new CPTask({
                            description: 'Sencha Cmd Service',
                            executable: path,
                            cmdFormatted: true,
                            stderrLevel: 'info',
                            args: [
                                'config',
                                '-prop',
                                'cmd.service.timeout=5',
                                'then',
                                'service',
                                'start',
                                '-port',
                                me.port
                            ],
                            opts: {
                                detached: false,
                                cwd: me.directory,
                                env: {
                                    '_JAVA_OPTIONS': '-Xmx' + me.maxMemSize + 'M'
                                }
                            }
                        });
                        task.setInternal(true);
                        me.cmdServiceTask = task;
                        process.on('beforeExit', function(){
                            me._shutdown();
                            task.stop();
                        });
                        resolve(task);
                    }
                    else {
                        reject('path not found :' + me.path);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });

    }

    _dispatchMessage (message) {
        var me = this,
            type = message.$type,
            shortName = type.substring(type.lastIndexOf('.') + 1),
            list = me._handlers[shortName] || me._handlers[type];

        if (list) {
            list.forEach(function(handler) {
                try {
                    handler.dispatch(message);
                } catch (e) {
                    console.error(e);
                }
            });
        }
    }

    register (handlers) {
        var me = this;
        Object.keys(handlers).forEach((key) => {
            var handler = handlers[key],
                list = me._handlers[key] || (me._handlers[key] = []);
            list.push(handler);
        });
    }

    _getUrl(suffix) {
        return '/' + suffix;
    }

    _fireReady () {
        var me = this,
            listener;
        me._ready = true;
        while ((listener = me._readyListeners.shift())) {
            try {
                listener();
            } catch (err) {
                console.error(err.stack || err);
            }
        }
    }

    _detectReady () {
        var me = this;
        me._ajax({
            url: '/',
            method: 'GET'
        }).then(function(){
            me._detectStart = null;
            me._fireReady();
        }).catch(function(){
            var now = new Date().getTime(),
                start = me._detectStart || (me._detectStart = now);
            if ((now - start) < (30 * 1000)) {
                setTimeout(me._detectReady.bind(me), 250);
            }
        });
    }

    _onReady (callback) {
        var me = this;
        if (me._ready) {
            callback && callback();
        }
        me._readyListeners.push(callback);
    }

    _ajax (opts) {
        var me = this;
        return new Promise(function(resolve, reject){
            if (!me.useService) {
                reject('Service API not enabled');
            }

            try {
                var obj = {
                        protocol: 'http:',
                        hostname: Util.getLocalIpAddress(),
                        port: me.port,
                        method: opts.method,
                        path: opts.url
                    },
                    params = opts.params,
                    req;

                if (params) {
                    var sep = obj.path.indexOf('?') > -1 ? '&' : '?';

                    for (var name in params) {
                        obj.path = obj.path + sep + name + '=' + encodeURIComponent(params[name]);
                    }
                }

                req = http.request(obj, function(res) {
                    var data = '';
                    res.on('data', function(chunk){
                        data += chunk;
                    });
                    res.on('end', function(){
                        resolve(data);
                    });
                });

                req.on('error', function(err){
                    reject(err);
                });

                var data = opts.data || opts.jsonData;

                if (typeof data != 'string') {
                    data = JSON.stringify(data);
                }
                if (data) {
                    req.write(data);
                }

                req.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    _poll() {
        var me = this;

        me.polling = true;
        return me._ajax({
            url: me._getUrl('updates'),
            timeout: 60 * 1000,
            method: 'GET'
        }).then(function (text) {
            var messages = JSON.parse(text),
                array = messages.messages;
            me.polling = false;
            me.fire('updateStart');

            for (var i = 0; i < array.length; i++) {
                me._dispatchMessage(array[i]);
            }

            me.fire('updateDone');
            me._poll();
        }).catch(function (err, opts) {
            setTimeout(me._poll.bind(me), 250);
        });
    }

    _initServiceClient () {
        var me = this;
        if (me.useService && !me._clientInitialized) {
            me._clientInitialized = true;
            me._loadTasks().then(function(){
                me._poll();
            }).catch(function(){
                me._poll();
            });

            me.updateServiceSettings({
                'enable.message.stream': true
            }).then(function(text){
                me.serviceSettings = JSON.parse(text);
            }).catch(function(err){
                //console.log("enabling task polling");
                me.enableTaskPolling = true;
                me._loadTasks();
            });
        }
    }

    _getTask (status) {
        var me = this,
            id = status.id || status.taskId,
            task = TaskManager.getTask(id);

        if (!task) {
            task = new CmdTask({
                id: id,
                threadId: status.threadId,
                status: status,
                cmdClient: me,
                description: status.description
            });

            task.update(status);
        }

        me.tasks[task.id] = task;
        return task;
    }

    _loadTasks() {
        var me = this,
            url = me._getUrl('tasks/list');

        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: url,
                    method: 'GET'
                }).then(function(text) {
                    var tasks = JSON.parse(text).tasks,
                        actual = [];

                    for(var i = 0; i < tasks.length; i++) {
                        var stat = tasks[i],
                            task = stat && me._getTask(stat);

                        actual.push(task);
                        task.update(stat);
                    }

                    if (me.enableTaskPolling) {
                        setTimeout(me._loadTasks.bind(me), 5000);
                    }
                    resolve(actual);
                }).catch(function(err) {
                    reject(err);
                });
            });
        });
    }

    adjustLogging (level) {
        var me = this;
        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    method: 'POST',
                    url: this._getUrl('logging'),
                    jsonData: {
                        level: {
                            name: level
                        }
                    }
                }).then(function(data) {
                    resolve(data);
                }).catch(function(err) {
                    reject(err);
                });
            });
        });
    }

    loadWorkspace (dir) {
        var me = this,
            url = me._getUrl("workspace/load");

        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: url,
                    params: {
                        directory: dir
                    },
                    method: 'GET'
                }).then(function (text) {
                    var data = JSON.parse(text);
                    resolve(data);
                }).catch(function(err) {
                    reject(err);
                });
            });
        });
    }

    /**
     *
     * {
     *     args: [
     *         "app",
     *         "build"
     *     ],
     *     cwd: '/path/to/run/from',
     *     params: {
     *         "build.environment": "testing",
     *         "app.theme": "ext-theme-neptune",
     *         "app.locale": "en"
     *     },
     *     async: true
     *     captureUpdates: true, // (async)
     *     captureLog: true, // (async)
     *     captureAntEvents: true,
     * }
     *
     */
    dispatch (opts, useProcess) {
        var me = this;
        useProcess = useProcess || me.useProcessForDispatch;

        if (useProcess) {
            return me.execProcess(Object.assign({
                binary: me.path
            }, opts));
        }

        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: '/dispatch',
                    method: 'POST',
                    jsonData: opts
                }).then(function (text) {
                    var taskStatus = JSON.parse(text),
                        task = me._getTask(taskStatus);
                    resolve(task);
                }).catch(function(err) {
                    reject(err);
                });
            });
        });
    }

    /**
     *
     * {
     *     binary: 'path/to/some.exe',
     *     useShell: true,
     *     args: [
     *         "app",
     *         "build"
     *     ],
     *     cwd: '/path/to/run/from',
     *     params: {
     *         "build.environment": "testing",
     *         "app.theme": "ext-theme-neptune",
     *         "app.locale": "en"
     *     },
     *     async: true
     *     captureUpdates: true, // (async)
     *     captureLog: true, // (async)
     *     captureAntEvents: true,
     * }
     *
     */
    exec (opts, useProcess) {
        var me = this;
        useProcess = useProcess || me._useProcessForExec;

        if (useProcess) {
            return me.execProcess(opts);
        }

        return new Promise(function(resolve, reject) {
            me._onReady(function () {
                me._ajax({
                    url: '/exec',
                    method: 'POST',
                    jsonData: opts
                }).then(function (text) {
                    var taskStatus = JSON.parse(text),
                        task = me._getTask(taskStatus);
                    resolve(task);
                }).catch(function(err) {
                    reject(err);
                });
            });
        });
    }

    execProcess (opts) {
        var me = this;
        return new Promise(function(resolve, reject) {
            try {
                var path = me.getPath(),
                    env = {},
                    task;

                if (opts.params) {
                    for (var key in opts.params) {
                        var sysKey = 'sencha.cmd.' + key,
                            value = opts.params[key];
                        env[sysKey] = value;
                    }
                }

                Object.assign(env, {
                    '_JAVA_OPTIONS': '-Xmx' + me.maxMemSize + 'M'
                });
                task = new CPTask(Object.assign(opts, {
                    executable: opts.binary || path,
                    cmdFormatted: true,
                    stderrLevel: 'info',
                    opts: {
                        detached: false,
                        env: env,
                        cwd: opts.cwd
                    }
                }));
                resolve(task);
            } catch (e) {
                reject(e);
            }
        });
    }


    stopTask (task) {
        var me = this;
        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: '/tasks/stop',
                    method: 'GET',
                    params: {
                        taskId: task.id
                    }
                }).then(function(data){
                    resolve(data);
                }).catch(function(err){
                    reject(err);
                });
            });
        });
    }

    updateServiceSettings (settings) {
        var me = this;
        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: '/settings',
                    method: 'post',
                    jsonData: settings
                }).then(function (text) {
                    me.serviceSettings = JSON.parse(text);
                    resolve(me.serviceSettings);
                }).catch(function(err){
                    reject(err);
                });
            });
        });
    }

    _shutdown () {
        var me = this,
            cleanup = function(){
                if (me.serviceTask) {
                    me.serviceTask.stop();
                    me.serviceTask = null;
                }
            };
        return new Promise(function(resolve, reject){
            me._onReady(function(){
                me._ajax({
                    url: '/shutdown',
                    method: 'GET'
                }).then(function () {
                    cleanup();
                    resolve();
                }).catch(function(err){
                    cleanup();
                    reject(err);
                });
            });
        });
    }
}

module.exports = Client;
