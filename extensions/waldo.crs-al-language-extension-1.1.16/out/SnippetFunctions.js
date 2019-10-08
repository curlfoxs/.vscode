"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path_1 = require("path");
const vscode = require("vscode");
const Settings_1 = require("./Settings");
const crsOutput = require("./CRSOutput");
class SnippetFunctions {
    static SetupCRSAlSnippets() {
        let mySettings = Settings_1.Settings.GetConfigSettings(null);
        let setDisabled = mySettings[Settings_1.Settings.DisableCRSSnippets];
        this.SetupSnippets('waldo.crs-al-language', setDisabled);
    }
    static SetupDefaultAlSnippets() {
        let mySettings = Settings_1.Settings.GetConfigSettings(null);
        let setDisabled = mySettings[Settings_1.Settings.DisableDefaultAlSnippets];
        this.SetupSnippets('microsoft.al', setDisabled);
        this.SetupSnippets('ms-dynamics-smb.al', setDisabled);
    }
    static SetupSnippets(extension, setDisabled) {
        //console.log(process.env.USERPROFILE);
        function MicrosftAl(element) {
            return element.startsWith(extension);
        }
        ;
        fs.readdir(path_1.join(process.env.USERPROFILE, '.vscode', 'extensions'), (err, files) => {
            files.filter(MicrosftAl).forEach(file => {
                let microsoftAlSnippetsDir = path_1.join(process.env.USERPROFILE, '.vscode', 'extensions', file, 'snippets');
                let microsoftAlSnippetsDirDisabled = path_1.join(process.env.USERPROFILE, '.vscode', 'extensions', file, 'snippets-disabled');
                if (setDisabled) {
                    if (fs.existsSync(microsoftAlSnippetsDir)) {
                        fs.renameSync(microsoftAlSnippetsDir, microsoftAlSnippetsDirDisabled);
                        //console.log('Renamed ' + microsoftAlSnippetsDir + ' -> ' + microsoftAlSnippetsDirDisabled);
                        vscode.window.showInformationMessage('Snippets from ' + extension + ' successfully disabled. Please restart VSCode.');
                        crsOutput.showOutput('Snippets from ' + extension + ' successfully disabled. Please restart VSCode.');
                    }
                    else {
                        (!fs.existsSync(microsoftAlSnippetsDirDisabled)) ?
                            console.log('Snippet-directory not found - nothing to disable.') :
                            null;
                    }
                }
                else {
                    if (fs.existsSync(microsoftAlSnippetsDirDisabled)) {
                        fs.renameSync(microsoftAlSnippetsDirDisabled, microsoftAlSnippetsDir);
                        //console.log('Renamed ' + microsoftAlSnippetsDirDisabled + ' -> ' + microsoftAlSnippetsDir);
                        vscode.window.showInformationMessage('Snippets from ' + extension + ' successfully enabled. Please restart VSCode.');
                        crsOutput.showOutput('Snippets from ' + extension + ' successfully enabled. Please restart VSCode.');
                    }
                    else {
                        (!fs.existsSync(microsoftAlSnippetsDir)) ?
                            console.log('Disabled snippet-directory not found - nothing to enable.') :
                            null;
                    }
                }
            });
        });
    }
}
exports.SnippetFunctions = SnippetFunctions;
//# sourceMappingURL=SnippetFunctions.js.map