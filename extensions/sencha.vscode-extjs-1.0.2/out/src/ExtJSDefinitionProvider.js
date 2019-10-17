'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/**
 * Provides code completion suggestions from sencha-tern
 */
class ExtJSDefinitionProvider {
    constructor(tern, licenseManager) {
        this.tern = tern;
        this.licenseManager = licenseManager;
    }
    provideDefinition(document, position, token) {
        if (!this.licenseManager.isActive() || !this.tern.isReady()) {
            return Promise.resolve([]);
        }
        return new Promise((resolve, reject) => {
            const request = {
                query: {
                    type: 'definition',
                    lineCharPositions: true,
                    file: document.fileName,
                    end: { line: position.line, ch: position.character },
                    files: [{
                            type: 'full',
                            name: document.fileName,
                            text: document.getText()
                        }]
                }
            };
            return this.tern.sendDocument(document)
                .then(() => this.tern.send(request))
                .then(results => {
                resolve(results['map'](result => {
                    const uri = vscode.Uri.file(`${result['origin']}`);
                    const position = new vscode.Position(result['start']['line'], result['start']['ch']);
                    return new vscode.Location(uri, position);
                }));
            })
                .catch(e => resolve(null));
        });
    }
}
exports.default = ExtJSDefinitionProvider;
//# sourceMappingURL=ExtJSDefinitionProvider.js.map