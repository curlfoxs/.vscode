/**
 * Shows plugin log file
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const Platform_1 = require("./Platform");
/**
 * Default activate function
 * @param {ExtensionContext} context - right click context
 */
function activate(context) {
    return new Promise((resolve, reject) => {
        let logFile = path.join(Platform_1.default.settingsDir, 'vscode-extjs.log');
        vscode.workspace.openTextDocument(vscode.Uri.file(logFile))
            .then(doc => vscode.window.showTextDocument(doc).then(editor => {
            if (editor) {
                resolve(editor);
            }
            else {
                resolve(null);
            }
        }));
    });
}
exports.default = activate;
//# sourceMappingURL=ExtJSPluginLog.js.map