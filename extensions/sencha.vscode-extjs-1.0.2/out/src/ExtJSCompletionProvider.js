'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function getKind(completion) {
    switch (completion.reference) {
        case 'Config':
            return vscode.CompletionItemKind.Property;
        case 'Event':
            return vscode.CompletionItemKind.Function;
        case 'Alias':
            return vscode.CompletionItemKind.Enum;
        case 'Field':
        case 'ViewComponent':
        case 'Store':
        case 'BindExpression':
            return vscode.CompletionItemKind.Value;
        case 'ControllerMethod':
            return vscode.CompletionItemKind.Method;
    }
    if (completion.isClass) {
        return vscode.CompletionItemKind.Class;
    }
    else if (completion.type.indexOf('fn(') === 0) {
        return completion.sencha ? vscode.CompletionItemKind.Method : vscode.CompletionItemKind.Function;
    }
    else if (completion.sencha) {
        if (completion.type.match(/^[A-Z]/)) {
            return vscode.CompletionItemKind.Class;
        }
        else {
            return vscode.CompletionItemKind.Property;
        }
    }
    else {
        return vscode.CompletionItemKind.Keyword;
    }
}
function getDetail(completion) {
    if (completion.isClass) {
        return `class ${completion.name}`;
    }
    else {
        return completion.type;
    }
}
/**
 * Provides code completion suggestions from sencha-tern
 */
class ExtJSCompletionProvider {
    constructor(tern, licenseManager) {
        this.tern = tern;
        this.licenseManager = licenseManager;
    }
    /**
     * Called when the code completion menu is shown.  Returns suggestions from sencha-tern
     */
    provideCompletionItems(document, position, token) {
        if (!this.licenseManager.isActive() || !this.tern.isReady()) {
            return Promise.resolve([]);
        }
        return new Promise((resolve, reject) => {
            const request = {
                query: {
                    type: 'completions',
                    end: { line: position.line, ch: position.character },
                    file: document.fileName,
                    guess: true,
                    lineCharPositions: true,
                    origins: true,
                    sort: true,
                    types: true,
                    docs: true,
                    caseInsensitive: true,
                    urls: true
                },
                files: [{
                        type: 'full',
                        name: document.fileName,
                        text: document.getText()
                    }]
            };
            this.tern.send(request).then(result => {
                const suggestions = result.completions.map(completion => {
                    let item = new vscode.CompletionItem(completion.name);
                    item.kind = getKind(completion);
                    item.detail = getDetail(completion);
                    item.insertText = completion.name;
                    item.sortText = `0${completion.name}`;
                    return item;
                });
                resolve(suggestions);
            }).catch(e => {
                resolve([]);
            });
        });
    }
}
exports.default = ExtJSCompletionProvider;
//# sourceMappingURL=ExtJSCompletionProvider.js.map