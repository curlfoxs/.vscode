/**
 * Function for create classic app command
 * @author Ritesh Patel
 */
'use strict';
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
const AppManager_1 = require("./AppManager");
const Util_1 = require("./Util");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
const path = require("path");
const fs_1 = require("fs");
const Platform_1 = require("./Platform");
let sdk, location;
const util = new Util_1.default();
const themes = {
    universal: ['theme-triton', 'theme-neptune'],
    modern: ['theme-triton', 'theme-neptune', 'theme-ios', 'theme-material'],
    classic: []
};
function isValidName(name) {
    return name.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);
}
class ExtJSApp {
    constructor(tern) {
        this.tern = tern;
    }
    /**
     * Set up prompts to create the classic app
     * @param {ExtensionContext} context - right click context
     */
    createApp(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let isContext = false, location;
                if (context) {
                    let contextPath = context["fsPath"];
                    location = contextPath;
                    isContext = true;
                }
                else {
                    location = vscode_1.workspace.rootPath || Platform_1.default.home;
                }
                // Name
                const name = yield vscode_1.window.showInputBox({ "prompt": "Step 1 of 5: Specify app name", "ignoreFocusOut": true });
                if (!name)
                    return; // user clicked esc or did not enter input
                if (!isValidName(name))
                    return vscode_1.window.showErrorMessage('App name must contain only letters, numbers, and underscore ("_").');
                // Location       
                location = yield vscode_1.window.showInputBox({ "prompt": "Step 2 of 5: Specify app location", "value": path.join(location, name), "ignoreFocusOut": true });
                if (!location)
                    return; // user clicked esc or did not enter input
                if (fs_1.existsSync(location))
                    return vscode_1.window.showErrorMessage('An app already exists at that location');
                // SDK
                sdk = yield vscode_1.window.showInputBox({ "prompt": "Step 3 of 5: Specify SDK path", "value": this.getSDK(location), "ignoreFocusOut": true });
                if (!sdk)
                    return; // user clicked esc or did not enter input
                if (!util.isSDKPathValid(sdk))
                    return vscode_1.window.showErrorMessage('Invalid SDK path');
                if (sdk.indexOf(vscode_1.workspace.rootPath) !== 0)
                    util.setSdkPath(sdk); // remember SDK choice if it's external SDK        
                // Toolkit
                let toolkit, toolkits = this.getToolkits(sdk);
                if (toolkits.length > 1) {
                    toolkit = yield vscode_1.window.showQuickPick(['classic', 'modern', 'universal'], { placeHolder: "Step 4 of 5: Select Toolkit", value: "classic" });
                }
                else {
                    toolkit = toolkits[0];
                }
                // Theme
                const theme = yield vscode_1.window.showQuickPick(util.getThemes(sdk, toolkit), { "placeHolder": "Step 5 of 5: Select Theme", "value": "theme-triton" });
                if (!theme)
                    return; // user clicked esc or did not enter input
                // Track event using MixPanel
                let pluginMixPanel = new PluginMixPanel_1.default(isContext);
                pluginMixPanel.sendTracker(Constants_1.default.CREATE_APP, { toolkit });
                // create the app
                return AppManager_1.default.createApp({ toolkit, sdk, tern: this.tern, location, theme, name });
            }
            catch (e) {
                vscode_1.window.showErrorMessage(e.message);
            }
        });
    }
    /**
     * Lists the available toolkits at the specified sdk path
     * @param {String} sdk The path to an Ext JS sdk
     */
    getToolkits(sdk) {
        try {
            if (parseInt(new Util_1.default().getMajorVersion(sdk)) >= 6) {
                return ['classic', 'modern', 'universal'];
            }
            else {
                return ['universal'];
            }
        }
        catch (e) {
            return ['universal'];
        }
    }
    /**
     * Gets the path to the first SDK in the workspace, or if the specified location is not a workspace, returns the last
     * used SDK.
     */
    getSDK(loc) {
        const senchaWorkspace = util.getWorkspacePath(loc);
        return (senchaWorkspace && util.sdkForWorkspace(senchaWorkspace)) || util.getSdkPath(vscode_1.workspace.rootPath);
    }
}
exports.default = ExtJSApp;
//# sourceMappingURL=ExtJSApp.js.map