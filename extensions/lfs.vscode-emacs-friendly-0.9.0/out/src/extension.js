"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const operation_1 = require("./operation");
var inMarkMode = false;
var markHasMoved = false;
function activate(context) {
    let op = new operation_1.Operation(), commandList = [
        "C-g",
        // Edit
        "C-k", "C-w", "M-w", "C-y", "C-x_C-o",
        "C-/", "C-j", "C-S_bs",
        // Navigation
        "C-l",
    ], cursorMoves = [
        "cursorUp", "cursorDown", "cursorLeft", "cursorRight",
        "cursorHome", "cursorEnd",
        "cursorWordLeft", "cursorWordRight",
        "cursorPageDown", "cursorPageUp",
        "cursorTop", "cursorBottom"
    ];
    commandList.forEach(commandName => {
        context.subscriptions.push(registerCommand(commandName, op));
    });
    cursorMoves.forEach(element => {
        context.subscriptions.push(vscode.commands.registerCommand("emacs." + element, () => {
            if (inMarkMode) {
                markHasMoved = true;
            }
            vscode.commands.executeCommand(inMarkMode ?
                element + "Select" :
                element);
        }));
    });
    initMarkMode(context);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function initMarkMode(context) {
    context.subscriptions.push(vscode.commands.registerCommand('emacs.enterMarkMode', () => {
        if (inMarkMode && !markHasMoved) {
            inMarkMode = false;
        }
        else {
            initSelection();
            inMarkMode = true;
            markHasMoved = false;
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('emacs.exitMarkMode', () => {
        const selections = vscode.window.activeTextEditor.selections;
        const hasMultipleSelecitons = selections.length > 1;
        if (hasMultipleSelecitons) {
            const allSelectionsAreEmpty = selections.every(selection => selection.isEmpty);
            if (allSelectionsAreEmpty) {
                vscode.commands.executeCommand("removeSecondaryCursors");
            }
            else {
                // initSelection() is used here instead of `executeCommand("cancelSelection")`
                // because `cancelSelection` command not only cancels selection state
                // but also removes secondary cursors though these should remain in this case.
                initSelection();
            }
        }
        else {
            // This `executeCommand("cancelSelection")` may be able to be replaced with `initSelection()`,
            // however, the core command is used here to follow its updates with ease.
            vscode.commands.executeCommand("cancelSelection");
        }
        if (inMarkMode) {
            inMarkMode = false;
        }
    }));
}
function registerCommand(commandName, op) {
    return vscode.commands.registerCommand("emacs." + commandName, op.getCommand(commandName));
}
function initSelection() {
    // Set new `anchor` and `active` values to all selections so that these are initialized to be empty.
    vscode.window.activeTextEditor.selections = vscode.window.activeTextEditor.selections.map(selection => {
        const currentPosition = selection.active;
        return new vscode.Selection(currentPosition, currentPosition);
    });
}
//# sourceMappingURL=extension.js.map