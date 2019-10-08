"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class GlobalDocumentSymbolProvider {
    constructor(global) {
        this.global = global;
    }
    provideDocumentSymbols(document, token) {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                resolve(self.global.provideDocumentSymbols(document));
            }
            catch (e) {
                logger_1.default.error("provideDocumentSymbols failed: " + e);
                return reject(e);
            }
        });
    }
}
exports.default = GlobalDocumentSymbolProvider;
//# sourceMappingURL=documentSymbolProvider.js.map