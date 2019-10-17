/**
 * Function for running app watch (with and without Fashion)
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const AppWatch_1 = require("./AppWatch");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
const path = require("path");
/**
 * Default function
 * @param {ExtensionContext} context - right click context
 */
class RunAppWatch {
    /**
     * Constructor
     * @param {TernManager} tern - Tern instance
     */
    constructor(tern) {
        this.tern = tern;
    }
    /**
     * calls start app watch
     * @param {Object} context - ExtensionContext
     * @param {boolean} withFashion - true : with fashion | false : without fashion
     */
    run(context, withFashion) {
        let fullPath = context && context['fsPath'];
        if (fullPath) {
            if (this.tern.started) {
                // get app path from tern
                this.tern.send({}, '/app?path=' + fullPath).then(result => this.startAppWatch(context, result.path, withFashion));
            }
            else {
                this.startAppWatch(context, fullPath, withFashion);
            }
        }
        else {
            let activeEditor = vscode_1.window.activeTextEditor;
            if (activeEditor) {
                let fileName = activeEditor.document.fileName;
                fullPath = fileName.substring(0, fileName.lastIndexOf(path.sep));
            }
            else {
                fullPath = vscode_1.workspace.rootPath;
            }
            if (this.tern.started) {
                // get app path from tern
                this.tern.send({}, '/app?path=' + fullPath).then(result => {
                    this.startAppWatch(context, result.path, withFashion);
                }).catch(e => {
                    vscode_1.window.showErrorMessage('Which app do you want to run? Right-click on an app in the project explorer and select "Run sencha app watch".');
                });
            }
            else {
                vscode_1.window.showErrorMessage('No Ext JS apps found. Please run "Enable Ext JS IntelliSense for this Project" first.');
            }
        }
    }
    /**
     * Runs app watch on the specified path
     * @param {ExtensionContext} context
     * @param {String} path The path to the Ext JS app
     * @param {String} withFashion True to enable fashion
     */
    startAppWatch(context, fullPath, withFashion) {
        // mix panel tracking
        let pluginMixPanel = new PluginMixPanel_1.default(context ? true : false);
        pluginMixPanel.sendTracker(Constants_1.default.START_APPWATCH);
        AppWatch_1.default.start(fullPath, withFashion);
    }
}
exports.default = RunAppWatch;
//# sourceMappingURL=RunAppWatch.js.map