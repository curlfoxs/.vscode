"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
exports.Terminal = vscode.window.createTerminal('crs');
function GitMove(from, to) {
    exports.Terminal.sendText(`git mv ${from} ${to}`);
}
exports.GitMove = GitMove;
function GitCommit(filepath) {
    exports.Terminal.sendText(`git add ${filepath}`);
    exports.Terminal.sendText(`git stage ${filepath}`);
    exports.Terminal.sendText(`git commit -m 'Commit ${filepath} before rename'`);
}
exports.GitCommit = GitCommit;
function OpenFileFromTerminal(path) {
    //Terminal.show();
    exports.Terminal.sendText(`code "${path}"`);
}
exports.OpenFileFromTerminal = OpenFileFromTerminal;
//# sourceMappingURL=CRSTerminal.js.map