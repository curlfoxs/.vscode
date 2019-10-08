'use strict';
var vscode = require('vscode');
var path = require('path');
var open = require('open');
var open_darwin = require('mac-open');
// decide what os should be used
// possible node values 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
var platform = process.platform;
// open file in custom browser
function openInSpecificPlatform(e, op, customBrowser) {
    customBrowser ? op(e, customBrowser) : op(e);
}
// common function for file opening
function openFile(e, customBrowser) {
    // check if it is html file
    var ext = path.extname(e.toString());
    if (/^\.(html|htm|shtml|xhtml)$/.test(ext)) {
        // platform is operational system
        // darwin - mac os, others are good with open npm module
        if (platform === 'darwin') {
            openInSpecificPlatform(e, open_darwin, customBrowser);
        }
        else {
            openInSpecificPlatform(e, open, customBrowser);
        }
    }
    else {
        vscode.window.showInformationMessage('Supports html file only!');
    }
}
// main code of the extension
function activate(context) {
    var disposable = vscode.commands.registerCommand('extension.viewInBrowser', function (e) {
        var config = vscode.workspace.getConfiguration('view-in-browser');
        var customBrowser = config.get("customBrowser");
        // if there is Uri it means the file was selected in the explorer.
        if (e.path) {
            openFile(e.fsPath, customBrowser);
        }
        else {
            var editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active text editor found!');
                return;
            }
            var file = editor.document.fileName;
            openFile("file:///" + file, customBrowser);
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map