'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode_1 = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var _statusBarItemBack;
    var _statusBarItemFwd;
    if (!this._statusBarItemBack) {
        this._statusBarItemBack = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    }
    if (!this._statusBarItemFwd) {
        this._statusBarItemFwd = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    }
    this._statusBarItemBack.command = "workbench.action.navigateBack";
    this._statusBarItemFwd.command = "workbench.action.navigateForward";
    this._statusBarItemBack.tooltip = "Back";
    this._statusBarItemFwd.tooltip = "Forward";
    this._statusBarItemBack.text = "$(arrow-left)";
    this._statusBarItemFwd.text = "$(arrow-right)";
    this._statusBarItemBack.show();
    this._statusBarItemFwd.show();
    //let  nav = new Navigation()
    console.log('Navigation is active!');
    context.subscriptions.push(_statusBarItemFwd);
    context.subscriptions.push(_statusBarItemBack);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map