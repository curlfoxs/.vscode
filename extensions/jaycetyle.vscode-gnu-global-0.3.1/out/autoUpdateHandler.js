"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
const logger_1 = require("./logger");
class GlobalAutoUpdateHandler {
    constructor(global, configuration) {
        this.global = global;
        this.configuration = configuration;
    }
    autoUpdateTags(docChanged) {
        if (docChanged.languageId !== "cpp" && docChanged.languageId !== "c")
            return;
        try {
            const autoUpdateMode = this.configuration.autoUpdate.get(docChanged.uri);
            if (autoUpdateMode === configuration_1.BoolDefault.Disabled) {
                return;
            }
            else if (autoUpdateMode == configuration_1.BoolDefault.Default) {
                /* Default: disable autoupdate if GTAGS size is larger than 50MB. */
                const size = this.global.getGtagsSize(docChanged);
                if (size >= 50 * 1024 * 1024)
                    return;
            }
            this.global.updateTags(docChanged);
        }
        catch (e) {
            logger_1.default.error("autoUpdateTags failed: " + e);
        }
    }
}
exports.default = GlobalAutoUpdateHandler;
//# sourceMappingURL=autoUpdateHandler.js.map