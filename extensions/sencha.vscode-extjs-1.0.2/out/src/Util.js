/**
 * Utility class
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Platform_1 = require("./Platform");
const vscode = require("vscode");
const logger = require('./Logger');
const intersection = require('lodash.intersection');
const path = require('path');
const fs = require('fs');
const cjson = require('cjson');
const guid = require('guid');
const SenchaCmd = require('sencha-cmd');
/**
 * Default Util class
 */
class Util {
    constructor() {
        this.versions = {
            pluginVersion: '',
            cmdVersion: ''
        };
        this.sdkPath = '';
    }
    /**
     * Creates a URI for opening a temporary file in a new tab
     */
    createTempFileUri(filename) {
        return vscode.Uri.parse(path.join('untitled:', filename));
    }
    /**
     * Strips off invalid characters from user input. Allows: a-z characters, numbers, underscore and dashes.
     * @param {string} userInput - Input entered by the user
     * @return {any} userInput - Corrected user input
     */
    validateUserInput(userInput) {
        let exp = /[^a-z0-9-_]/gi;
        userInput = userInput.replace(exp, '');
        return userInput;
    }
    /**
     * Validates SDK path
     * @param {string} sdkPath - User provided SDK path
     * @return {boolean} returnValue - true | false
     */
    isSDKPathValid(sdkPath) {
        return fs.existsSync(path.join(sdkPath, 'version.properties')) ||
            this.isTouchSdk(sdkPath);
    }
    /**
     * retrieves app name from app.json
     * @param {string} rootPath - workspace root path
     * @return {string} appName - ext app name
     */
    getAppName(appJsonPath) {
        let appName;
        if (fs.existsSync(appJsonPath)) {
            let data = cjson.load(appJsonPath);
            if (data && data.name) {
                appName = data.name;
            }
        }
        return appName || '';
    }
    /**
     * Checks if app is universal
     * @param {string} rootPath - workspace rootPath
     * @returns {boolean} returnValue - true | false
     */
    isAppUniversal(rootPath) {
        let returnValue = false;
        let appJson = path.join(rootPath, 'app.json');
        if (fs.existsSync(appJson)) {
            let data = cjson.load(appJson);
            if (data && data.builds) {
                returnValue = data.builds.classic.toolkit === 'classic' && data.builds.modern.toolkit === 'modern';
            }
        }
        return returnValue;
    }
    /**
     * Checks if workspace location is valid.
     * @returns {boolean} returnValue - true | false
     */
    isValidWorkspace(workspacePath) {
        try {
            fs.accessSync(path.join(workspacePath, '.sencha', 'workspace', 'sencha.cfg'));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    /**
     * Checks if Guid exists in mixpanel.json
     * @param {string} rootPath - workspace rootPath
     * @returns {boolean} true | false
     */
    checkIfGuidExist() {
        return fs.existsSync(path.join(Platform_1.default.settingsDir, 'mixpanel.json'));
    }
    /**
     * Creates Guid
     * @param {string} rootPath - workspace rootPath
     */
    createGuid() {
        let userGuid = guid.raw();
        fs.writeFileSync(path.join(Platform_1.default.settingsDir, 'mixpanel.json'), JSON.stringify({ guid: userGuid, consent: 'default' }, null, 4), 'utf8', (err) => {
            if (err)
                console.log('Error creating guid ', err);
            console.log('guid created');
        });
    }
    /**
     * Retrieves Guid from mixpanel.json
     * @param {string} rootPath - workspace rootPath
     * @returns {string} guid - guid
     */
    getGuid() {
        let userGuid;
        let data = cjson.load(path.join(Platform_1.default.settingsDir, 'mixpanel.json'));
        return data && data.guid ? data.guid : '';
    }
    /**
     * Returns mix panel guid and response
     * @return {any} data - mix panel json
     */
    getMixPanelParams() {
        let data = cjson.load(path.join(Platform_1.default.settingsDir, 'mixpanel.json'));
        return data ? data : {};
    }
    /**
     * Returns versions object with plugin and sencha cmd versions.
     * @returns {any} versions - versions object
     */
    getVersions() {
        let packageJson = path.join(__dirname, '..', '..', 'package.json');
        if (fs.existsSync(packageJson)) {
            var data = cjson.load(packageJson);
            this.versions.pluginVersion = data && data.version ? data.version : '6.2.0';
            this.versions.cmdVersion = SenchaCmd.cmdVersion();
        }
        return this.versions;
    }
    /**
     * Persists consent in a JSON file
     * @param {string} consent - user consent
     * @param {string} rootPath - root path
     */
    persistConsent(consent) {
        var params = this.getMixPanelParams();
        params.consent = consent;
        fs.writeFileSync(path.join(Platform_1.default.settingsDir, 'mixpanel.json'), JSON.stringify(params, null, 4), 'utf8', (err) => {
            if (err)
                console.log('Error updating consent ', err);
            console.log('user consent updated');
        });
    }
    /**
     * Checks if a path is an Ext app
     * @param {string} appPath - path to be checked
     * @returns {boolean} true | false
     */
    isExtApp(appPath) {
        return fs.existsSync(path.join(appPath, 'app.json'));
    }
    /**
     * Return JSON data from a file
     * @param {string} jsonFile - json file path
     * @returns {Object} data - json data or empty object
     */
    getJsonFromFile(jsonFile) {
        let data;
        if (fs.existsSync(jsonFile)) {
            data = cjson.load(jsonFile);
        }
        return data || {};
    }
    /**
     * Returns list of theme(s) based on the SDK version
     * @param {string} sdkPath - path to SDK
     * @returns {Array} themes - array of valid themes
     */
    getThemes(sdkPath, toolkit = null, universalOnly = true) {
        if (this.isTouchSdk(sdkPath)) {
            return this.listThemesAt(path.join(sdkPath, 'resources', 'themes', 'stylesheets', 'sencha-touch'), true);
        }
        else if (toolkit === 'classic' || toolkit === 'modern') {
            return this.listThemesAt(path.join(sdkPath, toolkit));
        }
        else {
            const classicThemes = this.listThemesAt(path.join(sdkPath, 'classic'));
            const modernThemes = this.listThemesAt(path.join(sdkPath, 'modern'));
            if (classicThemes && modernThemes) {
                if (universalOnly) {
                    return intersection(classicThemes, modernThemes);
                }
                else {
                    return Array.from(new Set([...classicThemes, ...modernThemes]));
                }
            }
            else {
                return this.listThemesAt(path.join(sdkPath, 'packages'));
            }
        }
    }
    /**
     * Returns the path to the first framework in the workspace
     */
    sdkForWorkspace(workspace) {
        const jsonPath = path.join(workspace, 'workspace.json');
        if (!fs.existsSync(jsonPath))
            throw new Error("The selected location is not a valid workspace.");
        const config = cjson.load(jsonPath);
        const framework = Object.keys(config['frameworks'])[0];
        let frameworkPath = config['frameworks'][framework];
        return path.join(workspace, frameworkPath['path'] || framework);
    }
    /**
     * Returns true if the specified location is a Sencha Touch SDK
     */
    isTouchSdk(sdkPath) {
        return fs.existsSync(path.join(sdkPath, 'sencha-touch.js'));
    }
    /**
     * Lists the names of all themes in the specified directory
     */
    listThemesAt(dir, touch = false) {
        if (touch) {
            return fs.existsSync(dir) && fs.readdirSync(dir)
                .filter(name => name.match(/^.*.scss$/))
                .map(name => name.slice(1, name.length - 5));
        }
        else {
            return fs.existsSync(dir) && fs.readdirSync(dir)
                .filter(name => name.match(/^(ext-)?theme-/) && !name.match(/(neutral|base)/));
        }
    }
    /**
     * Get major SDK version from version.properties
     * @param {string} sdkPath - path to sdkPath
     * @returns {string} majorVersion - major version of the sdk (verion.major)
     */
    getMajorVersion(sdkPath) {
        let versionFile = path.join(sdkPath, 'version.properties');
        let majorVersion;
        let contents = fs.readFileSync(versionFile, 'utf8');
        let splitContent = contents.split('\n');
        for (let i = 0; i < splitContent.length; i++) {
            let line = splitContent[i];
            if (line.indexOf('version.major') !== -1) {
                let splitLines = line.split('=');
                majorVersion = splitLines[1];
                break;
            }
        }
        return majorVersion;
    }
    /**
     * Used to get a workspace path from the context path (user could technically click anywhere within the app, to run app watch it must be an
     * app folder)
     * @param {string} contextPath - context path
     * @returns {string} contextPath - workspace root of the context path
     */
    getWorkspacePath(contextPath) {
        if (this.isValidWorkspace(contextPath)) {
            return contextPath;
        }
        if (contextPath.indexOf(path.sep) !== -1) {
            contextPath = contextPath.substring(0, contextPath.lastIndexOf(path.sep));
            if (contextPath) {
                return this.getWorkspacePath(contextPath);
            }
            else {
                return contextPath;
            }
        }
    }
    /**
     * Returns app json path
     * @param {string} filePath - file path to search for app json
     */
    getAppJsonPath(filePath) {
        let appJsonPath = path.join(filePath, 'app.json');
        if (fs.existsSync(appJsonPath)) {
            return appJsonPath;
        }
        else {
            filePath = filePath.substring(0, filePath.lastIndexOf(path.sep));
            appJsonPath = path.join(filePath, 'app.json');
            if (appJsonPath) {
                return this.getAppJsonPath(filePath);
            }
            else {
                return appJsonPath;
            }
        }
    }
    /**
     * Checks if user has a valid sencha cmd installed (6+)
     * @return {boolean} hasValidCmd - true | false
     */
    isCmdInstalled() {
        let hasValidCmd = false;
        try {
            let cmdVersions = SenchaCmd.cmdVersion();
            if (cmdVersions && cmdVersions.length > 0) {
                for (var i = 0; i < cmdVersions.length; i++) {
                    let version = cmdVersions[i];
                    if (version.substring(0, 1) >= 6) {
                        hasValidCmd = true;
                        return hasValidCmd;
                    }
                }
            }
        }
        catch (e) {
            logger.log('info', "Error checking sencha cmd version", e);
        }
        return hasValidCmd;
    }
    /**
     * Checks if app is not duplicate within a workspace
     * @param {string} appName - new app name
     * @param {string} location - new app location
     * @return {boolean} appExist - true | false
     */
    doesAppExistInWorkspace(appName, location) {
        let appExist = false;
        let workspaceJson = '';
        // find workspace json
        if (location.indexOf(path.sep) !== -1) {
            workspaceJson = path.join(location, 'workspace.json');
            if (fs.existsSync(workspaceJson)) {
                // find app name in apps array
                let data = cjson.load(workspaceJson);
                if (data && data.apps) {
                    for (var i = 0; i < data.apps.length; i++) {
                        var name = data.apps[i];
                        if (name.toUpperCase() === appName.toUpperCase()) {
                            appExist = true;
                        }
                    }
                    return appExist;
                }
                else {
                    return appExist;
                }
            }
            else {
                if (location.indexOf(path.sep) !== -1) {
                    location = location.substring(0, location.lastIndexOf(path.sep));
                    return this.doesAppExistInWorkspace(appName, location);
                }
                else {
                    return appExist;
                }
            }
        }
    }
    /**
     * Reads sdkPath from settings file. Creates settings file with workspace.rootPath as sdkPath if one doesn't exists
     * @param {string} rootPath - workspace root path
     * @return {string} sdkPath - sdk path from settings file
     */
    getSdkPath(rootPath) {
        let data;
        let settingsFile = path.join(Platform_1.default.settingsDir, 'settings.json');
        if (fs.existsSync(settingsFile)) {
            data = cjson.load(settingsFile);
            if (data) {
                this.sdkPath = data["sdkPath"];
            }
        }
        else {
            fs.writeFileSync(settingsFile, JSON.stringify({ sdkPath: rootPath }, null, 4), 'utf8', (err) => {
                if (err) {
                    console.log('Error creating settings file ', err);
                }
                console.log('settings file created');
            });
        }
        return this.sdkPath || rootPath;
    }
    /**
     * Persists sdk path
     * @param {string} sdkPath : sdk path to be saved to the file system
     */
    setSdkPath(sdkPath) {
        let settingsFile = path.join(Platform_1.default.settingsDir, 'settings.json');
        if (sdkPath !== this.sdkPath) { // only persist if path is different
            if (fs.existsSync(settingsFile)) {
                fs.writeFileSync(settingsFile, JSON.stringify({ sdkPath: sdkPath }, null, 4), 'utf8', (err) => {
                    if (err) {
                        console.log('Error persisting sdk path', err);
                    }
                    this.sdkPath = sdkPath;
                });
            }
        }
    }
}
exports.default = Util;
//# sourceMappingURL=Util.js.map