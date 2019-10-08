"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const logger_1 = require("./logger");
class GlobalRebuildGtags {
    constructor(gtags) {
        this.gtags = gtags;
    }
    rebuildGtags() {
        let folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return;
        }
        let errors = [];
        for (let folder of folders) {
            try {
                this.gtags.rebuildTags(folder.uri);
            }
            catch (e) {
                logger_1.default.error("Failed to build tag for " + folder.name + ". " + e);
                errors.push(folder.name);
            }
        }
        if (0 == errors.length) {
            vscode.window.showInformationMessage('Build tag files successfully');
        }
        else {
            vscode.window.showErrorMessage("Failed to build tag files: " + errors);
        }
    }
}
exports.default = GlobalRebuildGtags;
//# sourceMappingURL=rebuildGtagsHandler.js.map