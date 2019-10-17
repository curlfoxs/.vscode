"use strict";

var Configuration = require('../../config/Configuration');
var WorkspaceMember = require('../WorkspaceMember');
var Testable = require('../Testable');
var TargetUrl = require('../TargetUrl');
var BuildProfile = require('./BuildProfile');
var Handlebars = require('handlebars');

var fs = require('fs');
var Path = require('path');
var xfs = require('../../xfs');
var File = require('orion-core/lib/fs/File');
var responseTemplate = new File(__dirname).join('build.response.handlebars');
var depsResponseTemplate = new File(__dirname).join('deps.build.response.handlebars');
var indexHtmlTemplate = new File(__dirname).join('build.html.handlebars');

Handlebars.registerHelper('test', function(v1, v2, options){
    if (v1 == v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

/**
 * This class manages a Package definition.
 */
class CodeBase extends WorkspaceMember {
    static get meta () {
        return {
            prototype: {
                isCodeBase: true
            },
            mixins: [
                Testable,
                TargetUrl
            ]
        };
    }

    ctor () {
        var me = this,
            profileNames = me.getBuildNames(); // this seeds the cache of build names.

        if (profileNames.length === 0) {
            // if profiles are configured, add a default
            profileNames = [''];
        }

        me.profiles = {};
        profileNames.forEach(function(name){
            me.profiles[name] = new BuildProfile({
                name: name,
                owner: me
            });
        });
    }

    getTestProjectPath () {
        /*
            Apps and Packages store a "tests" object in their "development" object:

                "development": {
                    "tests": {
                        "path": "test/project.json"
                    }
                }
         */
        var path = this.get('development');

        path = path && path.tests;
        path = path && path.path;

        path = path && this.resolve(path);
        return path;
    }

    setTestProjectPath (path) {
        var dev = this.get('development'),
            tests;

        if (!dev) {
            this.set('development', dev = {});
        }

        tests = dev.tests || (dev.tests = {});

        tests.path = path;
    }

    loadChildren () {
        var me = this,
            config = new Configuration(),
            file = me.resolve(me.constructor.configPath),
            myself = () => me;

        return Promise.all([
            this.loadTests(),

            config.load(file).then(function (cfg) {
                me.configFile = cfg;
            }, function (e) {
                // ignore
            })
        ]).then(myself, myself);
    }

    setWorkspace (workspace) {
        super.setWorkspace(workspace);

        var packages = this.packages;

        if (packages) {
            packages.forEach(pkg => pkg.setWorkspace(workspace));
        }
    }

    hasProfiles () {
        return this.getBuildNames().length > 0;
    }

    /**
     * Returns the named BuildProfile.
     * NOTE: if name is not provided will either return the first
     * build profile, or if no build profiles are available, the
     * "default" build profile (name='').
     * @param name
     * @return {core.model.cmd.BuildProfile}
     */
    getBuildProfile (name) {
        var me = this,
            profile = me.profiles[name || ''];

        if (!profile && !name) {
            return me.getBuildProfiles()[0];
        }

        return profile;
    }

    /**
     * Magic. Will return a default profile if none are present.
     * @return {core.model.cmd.BuildProfile[]}
     */
    getBuildProfiles () {
        var me = this,
            profiles = [];

        this.getBuildNames().map(function(name) {
            profiles.push(me.profiles[name]);
        });
        if (profiles.length === 0) {
            profiles.push(this.getBuildProfile(''));
        }

        return profiles;
    }

    /**
     * Returns the actual list of build profile names. Does NOT include the magic default profile.
     * @return {String[]}
     */
    getBuildNames () {
        var me = this,
            configs = me.profileConfigs, // cache used in this function only, seeded by constructor.
            data = me.data;

        if (data && !configs) {
            configs = [];

            var builds = (data.builds && Object.keys(data.builds)) || [null],
                themes = data.themes || [null],
                locales = data.locales || [null];

            builds.forEach((build) => {
                themes.forEach((theme) => {
                    locales.forEach((locale) => {
                        var name = [build, theme, locale].filter((item) => {
                            return !!item;
                        }).join('-');
                        configs.push(name);
                    });
                });
            });

            configs = configs.filter(function(item){
                return !!item;
            });
            me.profileConfigs = configs;
        }
        return configs || [];
    }

    setRootUrl(url) {
        var me = this,
            urlWas = me.rootUrl;
        me.rootUrl = url;
        me.fire({
            type: 'rooturl',
            url: url,
            old: urlWas
        });
    }

    /**
     * This method is primarily for scenario configuration to select a build configuration.
     * As a safety measure if the profileName is not found return the default (or first)
     * build configuration.
     * @param profileName
     * @return {String}
     */
    getProfileName (profileName) {
        var me = this,
            profiles = me.getBuildProfiles(),
            selected = me.getBuildProfile(profileName);
        selected = selected || profiles[0];
        return selected && selected.name;
    }

    getRootUrl() {
        return this.rootUrl || '';
    }

    getTargetPath () {
        var me = this,
            appIndexPath = me.appIndexPath,
            indexHtmlPath, workspaceDir;

        if (!appIndexPath) {
            indexHtmlPath = me.get('indexHtmlPath');
            workspaceDir = me.getWorkspace().dir;
            appIndexPath = xfs.getRelativePath(
                workspaceDir,
                xfs.join(me.dir, indexHtmlPath));
            appIndexPath = me.appIndexPath = xfs.normalize(appIndexPath);
        }
        if (!appIndexPath) {
            var indexFile = new File(me.dir).join('index.html');
            if (indexFile.existsSync()) {
                appIndexPath = "index.html";
            }
        }
        return appIndexPath;
    }

    // TODO most of this logic is app specific (Package.getTargetPath is currently overridden to workaround it)
    getTargetUrl () {
        return [
            this.getRootUrl(),
            this.getTargetPath()
        ].filter(function(item){
            return !!item;
        }).join('');
    }

    _getBuildDir (profile) {
        var workspace = this.workspace,
            file = new File(workspace.dir).join('.sencha').join('temp').join(this.get('name'));
        if (profile) {
            file = file.join(profile);
        }
        return file;
    }

    _getBuildResponseFile (profile) {
        return this._getBuildDir(profile).join('build.options');
    }

    _getDepBuildResponseFile (profile) {
        return this._getBuildDir(profile).join('dep.build.options');
    }

    _getBuildIndexFile (profile) {
        return this._getBuildDir(profile).join('index.html');
    }

    getGeneratedSubjectUrl(profile) {
        profile = this.getProfileName(profile);
        var workspace = this.workspace;
        return new File(workspace.dir).relativeTo(this._getBuildIndexFile(profile)).slashify();
    }

    _getTemplateOptions (buildName, skipSass) {
        var me = this;
        return {
            name: me.get('name'),
            dir: me._getBuildDir(buildName),
            type: me.isApp ? 'app' : 'package',
            buildName: buildName,
            isApp: me.isApp,
            skipSass: skipSass
        };
    }

    _extractTemplate (template, file, buildName, skipSass, options) {
        var me = this;
        return new Promise(function(resolve, reject){
            template.read().then(function(data){
                var fn = Handlebars.compile(data);
                file.write(fn(Object.assign(options || {}, me._getTemplateOptions(buildName, skipSass))))
                    .then(resolve, reject);
            }, reject);
        });
    }

    _extractBuildOptions (buildName, skipSass) {
        return this._extractTemplate(responseTemplate, this._getBuildResponseFile(buildName), buildName, skipSass);
    }

    _extractDepBuildOptions (buildName, skipSass) {
        return this._extractTemplate(depsResponseTemplate, this._getDepBuildResponseFile(buildName), buildName, skipSass);
    }

    _extractBuildIndex (buildName, skipSass) {
        var indexFile = this.resolve('index.html'),
            targetIndex = this._getBuildIndexFile(buildName),
            options = {
                relDir: '',
                relTempDir: ''
            },
            bootstrapContent,
            index = new File(indexFile);

        if (index.existsSync()) {
            var content = index.readSync(),
                re = /<!-- <x-bootstrap> -->([\s\S]*?)<!-- <\/x-bootstrap> -->/gm,
                match;

            options.relDir = new File(targetIndex).relativeTo(index.getParent()).slashify() + '/';
            options.relTempDir = index.relativeTo(new File(targetIndex).getParent()).slashify() + '/';

            if (content) {
                match = re.exec(content);
                if (match) {
                    bootstrapContent = match[1];
                    options.bootstrap = bootstrapContent;
                }
            }
        }
        return this._extractTemplate(indexHtmlTemplate, targetIndex, buildName, skipSass, options);
    }

    _getDispatchConfig (args, description) {
        var name = this.get('name'),
            tempDir = this.isApp
                ? "${workspace.build.dir}/temp/${build.environment}/${build.id}/" + name
                : "${workspace.build.dir}/temp/${build.id}/" + name,
            params = {};

        // build.id is from Cmd and includes build profile name.

        if (this.getBuildProfiles().length > 1) {
            Object.assign(params, {
                'build.temp.dir': tempDir
            });
        }

        return {
            args: args,
            async: true,
            cwd: this.dir,
            captureUpdates: true,
            captureAntEvents: true,
            captureLog: true,
            description: description,
            params: params
        };
    }

    _runDispatch (cmdClient, dispatchCfg) {
        var me = this,
            separateProcess = me.appWatchInProcess;
        return cmdClient.dispatch(dispatchCfg, separateProcess);
    }

    runBuild (cmdClient, buildName, env, clean) {
        var me = this,
            profile = me.getBuildProfile(buildName),
            name = profile.displayName,
            description = me.getName() + ' ' +
                (me.isApp ? 'App' : '') +
                (me.isPackage ? 'Package' : '') +
                (me.isFramework ? 'Framework' : '') +
                ' Build ' + name + ' ' + (env ? env : ''),
            dispatchCfg;

        if (me.record) {
            me.record.addCls('app-building');
        }

        dispatchCfg = me._getDispatchConfig(
            profile.getBuildCommand((me.isApp ? 'app' : 'package'), 'build', env, clean),
            description);

        return me._runDispatch(cmdClient, dispatchCfg).then(function(task){
            task.on({
                scope: me,
                complete: function(event) {
                    if (me.record) {
                        me.record.removeCls('app-building');
                    }
                }
            });
            if (env == 'development' && profile) {
                // Tell BuildProfile to build unit test files after completion of Sencha Cmd run.
                profile.setBuildTask(task);
            }
            return task;
        });
    }

    /**
     * Making a test build of a Package (or Framework) is more complicated and so requires the build response template
     * provided by CodeBase._extractBuildOptions().
     * and other details.
     *
     * @param cmdClient
     * @param buildName
     * @param skipSass
     * @param logHandler
     * @return {Promise}
     */
    runTestBuild (cmdClient, buildName, skipSass, logHandler) {
        buildName = this.getProfileName(buildName);
        var me = this,
            profile = me.getBuildProfile(buildName),
            name = profile.displayName,
            description = me.getName() + ' Test Build ' + name,
            dispatchCfg;


        return new Promise(function(resolve, reject){
            me._extractBuildOptions(buildName, skipSass).then(function(buildFile){
                me._extractBuildIndex(buildName, skipSass).then(function(indexFile){
                    dispatchCfg = me._getDispatchConfig([
                        "@" + buildFile
                    ], description);

                    if (me.record) {
                        me.record.addCls('app-building');
                    }

                    me._runDispatch(cmdClient, dispatchCfg).then(function(task){
                        task.on({
                            scope: me,
                            complete: function(event) {
                                if (me.record) {
                                    me.record.removeCls('app-building');
                                }
                                resolve(indexFile);
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
                }, reject);
            }, reject);
        });
    }

    /**
     * NOTE: See Studio/app/Prefs.js, dependencies is an experimental and currently disabled feature.
     *
     * @param cmdClient
     * @param buildName
     * @param skipSass
     * @param logHandler
     * @return {Promise}
     */
    runDependencyBuild (cmdClient, buildName, skipSass, logHandler) {
        buildName = this.getProfileName(buildName);
        var me = this,
            profile = me.getBuildProfile(buildName),
            name = profile.displayName,
            description = me.getName() + ' Test Build ' + name,
            dispatchCfg;


        return new Promise(function(resolve, reject){
            me._extractDepBuildOptions(buildName, skipSass).then(function(buildFile){
                dispatchCfg = me._getDispatchConfig([
                    "@" + buildFile
                ], description);

                if (me.record) {
                    me.record.addCls('app-building');
                }

                me._runDispatch(cmdClient, dispatchCfg).then(function(task){
                    task.on({
                        scope: me,
                        complete: function(event) {
                            if (me.record) {
                                me.record.removeCls('app-building');
                            }
                            resolve();
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
            }, reject);
        });
    }

    needsDevBuild (profile) {
        var me = this,
            path = me.getGeneratedSubjectUrl(me.getProfileName(profile)),
            wkdir = new File(me.workspace.dir),
            file = wkdir.join(path),
            ret;

        ret = file.existsSync() ? false : [path];

        return ret;
    }
}

module.exports = CodeBase;
