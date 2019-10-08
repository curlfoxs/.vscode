"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const logger_1 = require("./logger");
class GlobalShowVersionHandler {
    constructor(global) {
        this.global = global;
    }
    showGlobalVersion() {
        try {
            vscode.window.showInformationMessage(this.global.getVersion());
        }
        catch (e) {
            logger_1.default.error("showGlobalVersion failed: " + e);
            vscode.window.showInformationMessage('Failed to get GNU Global version');
        }
    }
}
exports.default = GlobalShowVersionHandler;
//# sourceMappingURL=showVersionHandler.js.map