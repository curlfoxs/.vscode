/**
 * Command function for editing templates
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Platform_1 = require("./Platform");
const vscode = require("vscode");
const path = require("path");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
/**
 * Default EditTemplates function
 * @param {ExtensionContext} context - right click context
 */
function default_1(context) {
    // mix panel tracking
    let pluginMixPanel = new PluginMixPanel_1.default(false);
    pluginMixPanel.sendTracker(Constants_1.default.EDIT_TEMPLATES);
    return new Promise((resolve, reject) => {
        let templateFile = path.join(Platform_1.default.settingsDir, Constants_1.default.TEMPLATE_FILE);
        // load document with a fake URI. default-snippets is registered in extension ts. Any calls with
        // default-snippets uri will instantiate SnippetProvider and return the snippet.
        vscode.workspace.openTextDocument(vscode.Uri.parse('default-snippets://vscode-extjs/fake/path/to/Default Ext JS Snippets.json'))
            .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.One)
            .then(editor => {
            if (editor) {
                vscode.workspace.openTextDocument(vscode.Uri.file(templateFile))
                    .then(doc => vscode.window.showTextDocument(doc, vscode.ViewColumn.Two)
                    .then(editor => {
                    if (editor) {
                        resolve(editor);
                    }
                    else {
                        resolve(null);
                    }
                }));
            }
            else {
                resolve(null);
            }
        }));
    });
}
exports.default = default_1;
//# sourceMappingURL=EditTemplates.js.map