"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class GlobalReferenceProvider {
    constructor(global) {
        this.global = global;
    }
    provideReferences(document, position, context, token) {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                resolve(self.global.provideReferences(document, position));
            }
            catch (e) {
                logger_1.default.error("provideReferences failed: " + e);
                return reject(e);
            }
        });
    }
}
exports.default = GlobalReferenceProvider;
//# sourceMappingURL=referenceProvider.js.map