'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const TemplateUtil_1 = require("./TemplateUtil");
/**
 *
 *
 * @export
 * @class SnippetProvider
 * @implements {vscode.TextDocumentContentProvider}
 * @author Ritesh Patel
 */
class SnippetProvider {
    constructor() {
        /**
         *
         *
         * @private
         *
         * @memberOf SnippetProvider
         */
        this.templateUtil = new TemplateUtil_1.default();
    }
    /**
     *
     *
     * @param {vscode.Uri} uri - a fake uri (snippet-preview)
     * @returns {string} - code snippets as a string
     *
     * @memberOf SnippetProvider
     */
    provideTextDocumentContent(uri) {
        let data = this.templateUtil.getTemplates();
        return JSON.stringify(data, null, 4);
    }
}
/**
 * Scheme to be registered for the plugin
 *
 * @static
 * @type {string}
 * @memberOf SnippetProvider
 */
SnippetProvider.scheme = 'default-snippets';
exports.default = SnippetProvider;
//# sourceMappingURL=SnippetProvider.js.map