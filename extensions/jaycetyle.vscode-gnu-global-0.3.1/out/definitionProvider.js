"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class GlobalDefinitionProvider {
    constructor(global) {
        this.global = global;
    }
    provideDefinition(document, position, token) {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                resolve(self.global.provideDefinition(document, position));
            }
            catch (e) {
                logger_1.default.error("provideDefinition failed: " + e);
                return reject(e);
            }
        });
    }
}
exports.default = GlobalDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map