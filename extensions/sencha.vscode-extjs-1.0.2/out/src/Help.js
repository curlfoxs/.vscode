"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const Util_1 = require("./Util");
class Help {
    static showLinuxHelp() {
        return __awaiter(this, void 0, void 0, function* () {
            let text = `
# Additional Configuration Required

Visual Studio Code has reached the maximum number of open file handles allowed by your 
operating system. The limit can be increased to its maximum by editing /etc/sysctl.conf 
and adding this line to the end of the file:

    fs.inotify.max_user_watches=524288

The new value can then be loaded in by running:

    sudo sysctl -p

Once this is done, please restart Visual Studio Code. 

# Single Command

All of the above can be done in a single command:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

For more information see:

https://code.visualstudio.com/docs/setup/linux#_error-enospc       
        `.trim();
            let file = new Util_1.default().createTempFileUri("additional_configuration_required.md");
            let document = yield vscode_1.workspace.openTextDocument(file);
            let editor = yield vscode_1.window.showTextDocument(document);
            editor.edit(builder => builder.insert(editor.selection.end, text));
            vscode_1.window.showErrorMessage('The Sencha Ext JS extension has encountered an error during initialization.  The document below describes how this can be fixed.');
        });
    }
}
exports.default = Help;
//# sourceMappingURL=Help.js.map