'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const logger_1 = require("./logger");
const global_1 = require("./global/global");
const gtags_1 = require("./global/gtags");
const configuration_1 = require("./configuration");
const autoUpdateHandler_1 = require("./autoUpdateHandler");
const showVersionHandler_1 = require("./showVersionHandler");
const rebuildGtagsHandler_1 = require("./rebuildGtagsHandler");
const definitionProvider_1 = require("./definitionProvider");
const referenceProvider_1 = require("./referenceProvider");
const completionItemProvider_1 = require("./completionItemProvider");
const documentSymbolProvider_1 = require("./documentSymbolProvider");
const configuration = new configuration_1.default();
const global = new global_1.default(configuration);
const gtags = new gtags_1.default(configuration);
const autoUpdateHandler = new autoUpdateHandler_1.default(global, configuration);
const showVersionHandler = new showVersionHandler_1.default(global);
const rebuildGtagsHandler = new rebuildGtagsHandler_1.default(gtags);
const disposables = [];
// Called when the extension is activated
// The extension is activated the very first time the command is executed
function activate(context) {
    logger_1.default.init(configuration);
    logger_1.default.info("Init logger successfully");
    disposables.push(vscode.languages.registerDefinitionProvider(['cpp', 'c'], new definitionProvider_1.default(global)));
    disposables.push(vscode.languages.registerReferenceProvider(['cpp', 'c'], new referenceProvider_1.default(global)));
    disposables.push(vscode.languages.registerCompletionItemProvider(['cpp', 'c'], new completionItemProvider_1.default(global, configuration)));
    disposables.push(vscode.languages.registerDocumentSymbolProvider(['cpp', 'c'], new documentSymbolProvider_1.default(global)));
    disposables.push(vscode.commands.registerCommand('extension.showGlobalVersion', showVersionHandler.showGlobalVersion, showVersionHandler));
    disposables.push(vscode.commands.registerCommand('extension.rebuildGtags', rebuildGtagsHandler.rebuildGtags, rebuildGtagsHandler));
    disposables.push(vscode.workspace.onDidSaveTextDocument(doc => autoUpdateHandler.autoUpdateTags(doc), autoUpdateHandler));
    logger_1.default.info("Extension is now active!");
}
exports.activate = activate;
// This method is called when the extension is deactivated
function deactivate() {
    disposables.forEach(d => d.dispose());
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map