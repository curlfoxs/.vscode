"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editor_1 = require("./editor");
class Operation {
    constructor() {
        this.commandList = {};
        this.editor = new editor_1.Editor();
        this.commandList = {
            'C-k': () => {
                this.editor.kill();
            },
            'C-w': () => {
                this.editor.cut();
            },
            'M-w': () => {
                this.editor.copy();
            },
            'C-y': () => {
                this.editor.yank();
            },
            "C-x_C-o": () => {
                this.editor.deleteBlankLines();
            },
            "C-/": () => {
                this.editor.undo();
                this.editor.setStatusBarMessage("Undo!");
            },
            'C-j': () => {
                this.editor.breakLine();
            },
            'C-g': () => {
                this.editor.setStatusBarMessage("Quit");
            },
            "C-S_bs": () => {
                this.editor.deleteLine();
            },
            'C-l': () => {
                this.editor.scrollLineToCenterTopBottom();
            }
        };
    }
    getCommand(commandName) {
        return this.commandList[commandName];
    }
}
exports.Operation = Operation;
//# sourceMappingURL=operation.js.map