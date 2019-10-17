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
// orion-core needs this because uses require('orion-core/..') rather than relative paths
require('module-alias/register');
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const ExtJSCompletionProvider_1 = require("./ExtJSCompletionProvider");
const Snippets_1 = require("./Snippets");
const ExtJSDefinitionProvider_1 = require("./ExtJSDefinitionProvider");
const ExtJSDocumentationProvider_1 = require("./ExtJSDocumentationProvider");
const ViewConfig_1 = require("./ViewConfig");
const EditTemplates_1 = require("./EditTemplates");
const RunAppWatch_1 = require("./RunAppWatch");
const stopAppWatch_1 = require("./stopAppWatch");
const ExtJSApp_1 = require("./ExtJSApp");
const ExtJSWorkspace_1 = require("./ExtJSWorkspace");
const ExtJSPackage_1 = require("./ExtJSPackage");
const ExtJSPluginLog_1 = require("./ExtJSPluginLog");
const AppWatch_1 = require("./AppWatch");
const Util_1 = require("./Util");
const TemplateUtil_1 = require("./TemplateUtil");
const LicenseManager_1 = require("./LicenseManager");
const TernManager_1 = require("./TernManager");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
const SnippetProvider_1 = require("./SnippetProvider");
const subdirs_1 = require("./subdirs");
const { window, workspace } = vscode;
const rootPath = workspace.rootPath;
const logger = require('./Logger');
const glob = require('glob');
const util = new Util_1.default();
const ternManager = new TernManager_1.default();
const licenseManager = new LicenseManager_1.default();
const pluginMixPanel = new PluginMixPanel_1.default();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // create templates json
        const templateUtil = new TemplateUtil_1.default();
        templateUtil.createTemplateJson();
        // instantiate snippets
        const snippets = new Snippets_1.default(ternManager, licenseManager);
        const provider = new SnippetProvider_1.default();
        const registrations = vscode.Disposable.from(vscode.workspace.registerTextDocumentContentProvider(SnippetProvider_1.default.scheme, provider));
        const filter = { language: 'javascript', scheme: 'file' };
        const documentationProvider = new ExtJSDocumentationProvider_1.default(ternManager, licenseManager);
        const app = new ExtJSApp_1.default(ternManager);
        const workspace = new ExtJSWorkspace_1.default(ternManager);
        const pkg = new ExtJSPackage_1.default(ternManager); // package is a reserved word
        const runAppWatch = new RunAppWatch_1.default(ternManager);
        function enableIntelliSense() {
            if (!ternManager.started && vscode.workspace.rootPath && licenseManager.isActive()) {
                ternManager.start();
                context.subscriptions.push(
                // code completion & definition providers
                vscode.languages.registerCompletionItemProvider(filter, snippets, '.', '\"'), vscode.languages.registerCompletionItemProvider(filter, new ExtJSCompletionProvider_1.default(ternManager, licenseManager), '.', '\"'), vscode.languages.registerDefinitionProvider(filter, new ExtJSDefinitionProvider_1.default(ternManager, licenseManager)));
                pluginMixPanel.sendTracker(Constants_1.default.PLUGIN_LAUNCH);
            }
        }
        context.subscriptions.push(registrations, 
        // create apps, packages, workspaces, etc...
        vscode.commands.registerCommand('extension.vscode-extjs.createApp', ifLicenseValid(context => app.createApp(context).then(success => success && enableIntelliSense()))), vscode.commands.registerCommand('extension.vscode-extjs.createWorkspace', ifLicenseValid(context => workspace.createWorkspace(context).then(success => success && enableIntelliSense()))), vscode.commands.registerCommand('extension.vscode-extjs.createPackage', ifLicenseValid(context => pkg.createPackage(context).then(success => success && enableIntelliSense()))), 
        // go to docs
        vscode.commands.registerCommand('extensions.vscode-extjs.goToDocs', ifLicenseValid(() => documentationProvider.goToDocs())), 
        // start / stop app watch (with and without fashion support)
        vscode.commands.registerCommand('extension.vscode-extjs.startAppWatch', ifLicenseValid(context => runAppWatch.run(context, false))), vscode.commands.registerCommand('extension.vscode-extjs.fashionAppWatch', ifLicenseValid(context => runAppWatch.run(context, true))), vscode.commands.registerCommand('extension.vscode-extjs.stopAppWatch', ifLicenseValid(stopAppWatch_1.default)), 
        // view logs, configs, etc...
        vscode.commands.registerCommand('extension.vscode-extjs.viewConfig', ViewConfig_1.default), vscode.commands.registerCommand('extension.vscode-extjs.showLogs', ExtJSPluginLog_1.default), vscode.commands.registerCommand('extension.vscode-extjs.editTemplates', ifLicenseValid(EditTemplates_1.default)), 
        // activate license
        vscode.commands.registerCommand('extension.vscode-extjs.activateLicense', () => licenseManager.checkLicense()), 
        // view license
        vscode.commands.registerCommand('extension.vscode-extjs.viewLicense', () => licenseManager.openLicenseFile()), 
        // reindex
        vscode.commands.registerCommand('extension.vscode-extjs.refreshIndex', ifLicenseValid(() => ternManager.reindex(true))), 
        // insert code snippets asynchronously
        vscode.commands.registerCommand('extension.vscode-extjs.insertSnippet', item => item.doInsert()), 
        // enable for project
        vscode.commands.registerCommand('extension.vscode-extjs.enable', ifLicenseValid(() => {
            if (ternManager.started) {
                vscode.window.showErrorMessage("Ext JS IntelliSense has already been enabled for this project.");
            }
            else {
                enableIntelliSense();
                vscode.window.showInformationMessage("Ext JS IntelliSense is now enabled for this project.");
            }
        })));
        // called on document save. used for reloading modified templates.
        vscode.workspace.onDidSaveTextDocument((textDocument) => {
            let fileName = textDocument.fileName;
            if (fileName.indexOf(Constants_1.default.TEMPLATE_FILE) !== -1) {
                let templates = templateUtil.loadTemplates();
                snippets.setTemplates(templates);
            }
        }, this);
        // enforce licensing
        licenseManager.on('licensechange', valid => {
            if (valid) {
                // mix panel tracking
                pluginMixPanel.handleDefaultConsent();
                if (hasExtJSCode(vscode.workspace.rootPath))
                    enableIntelliSense();
            }
        });
        licenseManager.checkLicense();
        if (!util.isCmdInstalled())
            window.showInformationMessage('The Sencha Ext JS Plugin requires Sencha Cmd version >= 6. Please install or upgrade to the latest version of Sencha Cmd');
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
    // stop app watch process (if running)
    AppWatch_1.default.stop();
    if (ternManager) {
        ternManager.stop();
    }
}
exports.deactivate = deactivate;
/**
 * Returns try if the directory contains a .sencha directory in any subdirectory
 */
function hasExtJSCode(dir) {
    return dir && !!subdirs_1.default(dir).find(dir => path.basename(dir) === '.sencha');
}
/**
 * Returns a function that executes the callback only if the user has a valid license;
 * @param {Function} callback
 */
function ifLicenseValid(callback) {
    return function (...params) {
        if (licenseManager.isActive()) {
            callback.apply(this, params);
        }
        else {
            licenseManager.showErrorMessage();
        }
    };
}
//# sourceMappingURL=extension.js.map