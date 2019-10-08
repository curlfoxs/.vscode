"use strict";
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
// Possible positions when C-l is invoked consequtively
var RecenterPosition;
(function (RecenterPosition) {
    RecenterPosition[RecenterPosition["Middle"] = 0] = "Middle";
    RecenterPosition[RecenterPosition["Top"] = 1] = "Top";
    RecenterPosition[RecenterPosition["Bottom"] = 2] = "Bottom";
})(RecenterPosition || (RecenterPosition = {}));
;
class Editor {
    constructor() {
        this.scrollLineToCenterTopBottom = () => {
            const editor = vscode.window.activeTextEditor;
            const selection = editor.selection;
            switch (this.centerState) {
                case RecenterPosition.Middle:
                    this.centerState = RecenterPosition.Top;
                    editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
                    break;
                case RecenterPosition.Top:
                    this.centerState = RecenterPosition.Bottom;
                    editor.revealRange(selection, vscode.TextEditorRevealType.AtTop);
                    break;
                case RecenterPosition.Bottom:
                    this.centerState = RecenterPosition.Middle;
                    // There is no AtBottom, so instead scroll a page up (without moving cursor).
                    // The current line then ends up as the last line of the window (more or less)
                    vscode.commands.executeCommand("scrollPageUp");
                    break;
            }
        };
        this.justDidKill = false;
        this.lastKill = null;
        this.centerState = RecenterPosition.Middle;
        vscode.window.onDidChangeActiveTextEditor(event => {
            this.lastKill = null;
        });
        vscode.workspace.onDidChangeTextDocument(event => {
            if (!this.justDidKill) {
                this.lastKill = null;
            }
            this.justDidKill = false;
        });
        vscode.window.onDidChangeTextEditorSelection(event => {
            this.centerState = RecenterPosition.Middle;
        });
    }
    static isOnLastLine() {
        return vscode.window.activeTextEditor.selection.active.line == vscode.window.activeTextEditor.document.lineCount - 1;
    }
    setStatusBarMessage(text) {
        return vscode.window.setStatusBarMessage(text, 1000);
    }
    setStatusBarPermanentMessage(text) {
        return vscode.window.setStatusBarMessage(text);
    }
    getSelectionRange() {
        let selection = vscode.window.activeTextEditor.selection, start = selection.start, end = selection.end;
        return (start.character !== end.character || start.line !== end.line) ? new vscode.Range(start, end) : null;
    }
    getSelection() {
        return vscode.window.activeTextEditor.selection;
    }
    getSelectionText() {
        let r = this.getSelectionRange();
        return r ? vscode.window.activeTextEditor.document.getText(r) : '';
    }
    setSelection(start, end) {
        let editor = vscode.window.activeTextEditor;
        editor.selection = new vscode.Selection(start, end);
    }
    getCurrentPos() {
        return vscode.window.activeTextEditor.selection.active;
    }
    // Kill to end of line
    kill() {
        return __awaiter(this, void 0, void 0, function* () {
            // Ignore whatever we have selected before
            yield vscode.commands.executeCommand("emacs.exitMarkMode");
            let startPos = this.getCurrentPos(), isOnLastLine = Editor.isOnLastLine();
            // Move down an entire line (not just the wrapped part), and to the beginning.
            yield vscode.commands.executeCommand("cursorMove", { to: "down", by: "line", select: false });
            if (!isOnLastLine) {
                yield vscode.commands.executeCommand("cursorMove", { to: "wrappedLineStart" });
            }
            let endPos = this.getCurrentPos(), range = new vscode.Range(startPos, endPos), txt = vscode.window.activeTextEditor.document.getText(range);
            // If there is something other than whitespace in the selection, we do not cut the EOL too
            if (!isOnLastLine && !txt.match(/^\s*$/)) {
                yield vscode.commands.executeCommand("cursorMove", { to: "left", by: "character" });
                endPos = this.getCurrentPos();
            }
            // Select it now, cut the selection, remember the position in case of multiple cuts from same spot
            this.setSelection(startPos, endPos);
            let promise = this.cut(this.lastKill != null && startPos.isEqual(this.lastKill));
            promise.then(() => {
                this.justDidKill = true;
                this.lastKill = startPos;
            });
            return promise;
        });
    }
    copy() {
        vscode.env.clipboard.writeText(this.getSelectionText());
        vscode.commands.executeCommand("emacs.exitMarkMode");
    }
    cut(appendClipboard) {
        return __awaiter(this, void 0, void 0, function* () {
            if (appendClipboard) {
                const text = yield vscode.env.clipboard.readText();
                vscode.env.clipboard.writeText(text + this.getSelectionText());
            }
            else {
                vscode.env.clipboard.writeText(this.getSelectionText());
            }
            let t = Editor.delete(this.getSelectionRange());
            vscode.commands.executeCommand("emacs.exitMarkMode");
            return t;
        });
    }
    yank() {
        this.justDidKill = false;
        return Promise.all([
            vscode.commands.executeCommand("editor.action.clipboardPasteAction"),
            vscode.commands.executeCommand("emacs.exitMarkMode")
        ]);
    }
    undo() {
        vscode.commands.executeCommand("undo");
    }
    getFirstBlankLine(range) {
        let doc = vscode.window.activeTextEditor.document;
        if (range.start.line === 0) {
            return range;
        }
        range = doc.lineAt(range.start.line - 1).range;
        while (range.start.line > 0 && range.isEmpty) {
            range = doc.lineAt(range.start.line - 1).range;
        }
        if (range.isEmpty) {
            return range;
        }
        else {
            return doc.lineAt(range.start.line + 1).range;
        }
    }
    deleteBlankLines() {
        return __awaiter(this, void 0, void 0, function* () {
            let selection = this.getSelection(), anchor = selection.anchor, doc = vscode.window.activeTextEditor.document, range = doc.lineAt(selection.start.line).range, nextLine;
            if (range.isEmpty) {
                range = this.getFirstBlankLine(range);
                anchor = range.start;
                nextLine = range.start;
            }
            else {
                nextLine = range.start.translate(1, 0);
            }
            selection = new vscode.Selection(nextLine, nextLine);
            vscode.window.activeTextEditor.selection = selection;
            for (let line = selection.start.line; line < doc.lineCount - 1 && doc.lineAt(line).range.isEmpty; ++line) {
                yield vscode.commands.executeCommand("deleteRight");
            }
            vscode.window.activeTextEditor.selection = new vscode.Selection(anchor, anchor);
        });
    }
    static delete(range = null) {
        if (range) {
            return vscode.window.activeTextEditor.edit(editBuilder => {
                editBuilder.delete(range);
            });
        }
    }
    deleteLine() {
        vscode.commands.executeCommand("emacs.exitMarkMode"); // emulate Emacs
        vscode.commands.executeCommand("editor.action.deleteLines");
    }
    breakLine() {
        vscode.commands.executeCommand("lineBreakInsert");
        vscode.commands.executeCommand("emacs.cursorHome");
        vscode.commands.executeCommand("emacs.cursorDown");
    }
}
exports.Editor = Editor;
//# sourceMappingURL=editor.js.map