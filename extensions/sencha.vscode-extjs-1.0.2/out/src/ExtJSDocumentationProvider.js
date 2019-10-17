'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
const { window } = vscode;
const { open } = require('openurl');
const pluginMixPanel = new PluginMixPanel_1.default();
/**
 * Opens Sencha API Docs
 */
class ExtJSDocumentationProvider {
    constructor(tern, licenseManager) {
        this.tern = tern;
        this.licenseManager = licenseManager;
    }
    /**
     * Opens the sencha.com api docs for the item at the cursor.
     */
    goToDocs() {
        if (!this.licenseManager.isActive()) {
            this.licenseManager.showErrorMessage();
        }
        if (!this.tern.isReady())
            return;
        const document = window.activeTextEditor.document;
        const position = window.activeTextEditor.selection.end;
        const request = {
            query: {
                type: 'documentation',
                lineCharPositions: true,
                file: document.fileName,
                end: { line: position.line, ch: position.character }
            }
        };
        this.tern.sendDocument(document)
            .then(() => this.tern.send(request))
            .then(result => {
            if (result['url']) {
                open(result['url']);
                pluginMixPanel.sendTracker(Constants_1.default.VIEW_DOCUMENTATION);
            }
            else {
                vscode.window.showInformationMessage('Ext JS: No documentation found for the selected keyword');
            }
        })
            .catch(e => console.log('error looking up documentation', e));
    }
}
exports.default = ExtJSDocumentationProvider;
//# sourceMappingURL=ExtJSDocumentationProvider.js.map