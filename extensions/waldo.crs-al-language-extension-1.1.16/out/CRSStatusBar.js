"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
exports.RunObjectFromStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
function toggleRunObjectFromStatusBar() {
    exports.RunObjectFromStatusBar.command = 'crs.RunCurrentObjectWeb';
    let currentfile = vscode.window.activeTextEditor.document.uri;
    if (!currentfile.fsPath.toLowerCase().endsWith('.al')) {
        exports.RunObjectFromStatusBar.hide();
    }
    else {
        exports.RunObjectFromStatusBar.text = 'Run In Web Client';
        exports.RunObjectFromStatusBar.show();
    }
}
exports.toggleRunObjectFromStatusBar = toggleRunObjectFromStatusBar;
//# sourceMappingURL=CRSStatusBar.js.map