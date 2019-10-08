"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
const logger_1 = require("./logger");
class GlobalCompletionItemProvider {
    constructor(global, configuration) {
        this.global = global;
        this.configuration = configuration;
    }
    provideCompletionItems(document, position, token, context) {
        var self = this;
        return new Promise((resolve, reject) => {
            try {
                const mode = this.configuration.completion.get(document.uri);
                if (mode !== configuration_1.BoolOption.Enabled)
                    return reject();
                resolve(self.global.provideCompletionItems(document, position));
            }
            catch (e) {
                logger_1.default.error("provideCompletionItems failed: " + e);
                return reject(e);
            }
        });
    }
}
exports.default = GlobalCompletionItemProvider;
//# sourceMappingURL=completionItemProvider.js.map