"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
exports.Terminal = vscode.window.createTerminal('crs');
function GitMove(from, to) {
    console.log(`git mv ${from} ${to}`);
    exports.Terminal.sendText(`git mv ${from} ${to}`);
}
exports.GitMove = GitMove;
//# sourceMappingURL=Terminal.js.map