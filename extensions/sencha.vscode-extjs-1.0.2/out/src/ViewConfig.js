/**
 * Command function for editing project config(s)
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
const fs = require("fs");
/**
 * Default activate function
 * @param {ExtensionContext} context - right click context
 */
function activate(context) {
    let isContext = context ? true : false;
    // mix panel tracking
    let pluginMixPanel = new PluginMixPanel_1.default(isContext);
    pluginMixPanel.sendTracker(Constants_1.default.VIEW_CONFIG);
    return new Promise((resolve, reject) => {
        let configFile = path.resolve(path.join(vscode.workspace.rootPath, '.sencha', 'ide', 'config.json'));
        if (fs.existsSync(configFile)) {
            vscode.workspace.openTextDocument(vscode.Uri.file(configFile))
                .then(doc => vscode.window.showTextDocument(doc).then(editor => {
                if (editor) {
                    resolve(editor);
                }
                else {
                    resolve(null);
                }
            }));
        }
        else {
            vscode.window.showErrorMessage('Please run the "Enable Ext JS IntelliSense for this Project" command first.');
        }
    });
}
exports.default = activate;
//# sourceMappingURL=ViewConfig.js.map