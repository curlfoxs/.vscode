'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const TemplateUtil_1 = require("./TemplateUtil");
/**
 * Snippet class. Provides templates as code completion through snippets.
 *
 * @export
 * @class Snippets
 * @implements {vscode.CompletionItemProvider}
 */
class Snippets {
    /**
     * Creates an instance of Snippets.
     *
     * @param {TernManager} tern - tern instance
     *
     * @memberOf Snippets
     */
    constructor(tern, licenseManager) {
        /**
         * Template utility instance
         *
         * @private
         *
         * @memberOf Snippets
         */
        this.templateUtil = new TemplateUtil_1.default();
        this.tern = tern;
        this.licenseManager = licenseManager;
        this.defaultTemplates = this.templateUtil.getTemplates(); // default templates
        this.userTemplates = this.templateUtil.loadTemplates(); // user modified templates (if any)
        this.snippets = Object.assign({}, this.defaultTemplates, this.userTemplates); // final snippets to serve from
    }
    /**
     * Provides snippet completions
     *
     * @param {vscode.TextDocument} document
     * @param {vscode.Position} position
     * @returns {Thenable<vscode.CompletionItem[]>}
     *
     * @memberOf Snippets
     */
    provideCompletionItems(document, position) {
        if (!this.licenseManager.isActive() || !this.tern.isReady()) {
            return Promise.resolve([]);
        }
        return new Promise((resolve, reject) => {
            let openFilePath = document.fileName, fullName = openFilePath.substring(openFilePath.lastIndexOf(path.sep) + 1), contextPath = openFilePath.substring(0, openFilePath.lastIndexOf(path.sep) + 1), items = [];
            for (var key in this.snippets) {
                let template = this.snippets[key];
                let item = new vscode.CompletionItem('snippet');
                item.kind = vscode.CompletionItemKind.Snippet;
                item.label = template.prefix;
                item.command = { command: `extension.vscode-extjs.insertSnippet`, arguments: [item], title: key };
                item.insertText = '';
                // we defer the actual insert so that we don't need to call tern just to create the completion items
                item['doInsert'] = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let { namespace } = yield this.tern.send({}, '/namespace?dir=' + contextPath);
                        let justFileName = fullName.substring(0, fullName.lastIndexOf('.'));
                        let classPath = namespace + '.' + justFileName;
                        let aliasPrefix = namespace.split(/\./)[0].toLowerCase();
                        let alias = justFileName.toLowerCase();
                        let body = template.body;
                        body = body.join('');
                        body = body.replace('{classname}', classPath);
                        body = body.replace('{xtype}', alias);
                        body = body.replace('{alias}', alias);
                        body = body.replace('{aliasPrefix}', aliasPrefix);
                        let editor = yield vscode.window.showTextDocument(document);
                        editor.edit(builder => builder.insert(position, body));
                    }
                    catch (e) {
                        console.log(e);
                    }
                });
                items.push(item);
            }
            resolve(items);
        });
    }
    /**
     * Sets templates for Snippets. Only gets called when a user modifies default templates.
     *
     * @param {Object} templates - ext templates from ext_templates.json.
     *
     * @memberOf Snippets
     */
    setTemplates(templates) {
        let defaultTemplates = this.templateUtil.getTemplates(); // default templates
        this.snippets = {};
        this.snippets = Object.assign({}, defaultTemplates, templates); // merge with modified templates
    }
}
exports.default = Snippets;
//# sourceMappingURL=Snippets.js.map