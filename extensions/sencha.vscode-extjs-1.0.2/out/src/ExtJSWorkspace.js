/**
 * ExtJS Workspace Class. Sets up input prompts and then calls AppManager to create the workspace
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
const Platform_1 = require("./Platform");
/**
 * Default ExtJSWorkspace class
 */
class ExtJSWorkspace {
    /**
     * Constructor
     * @param {TernManager} tern - Tern instance
     */
    constructor(tern) {
        this.tern = tern;
    }
    /**
     * Sets up input prompts for creating a workspace and uses AppManager to create the workspace
     * @param {ExtensionContext} context - right click context
     */
    createWorkspace(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let util = new Util_1.default(), isContext = context ? true : false, location;
            if (isContext) {
                location = context["fsPath"] + path.sep + 'workspace';
            }
            else {
                location = vscode_1.workspace.rootPath || Platform_1.default.home;
            }
            // Location
            location = yield vscode_1.window.showInputBox({ "prompt": "Step 1 of 2: Specify workspace location", "value": location, "ignoreFocusOut": true });
            if (!location)
                return;
            // SDK
            const sdkPath = yield vscode_1.window.showInputBox({ "prompt": "Step 2 of 2: Specify SDK path", "value": util.getSdkPath(vscode_1.workspace.rootPath), "ignoreFocusOut": true });
            if (!sdkPath)
                return;
            // set SDK path
            if (!util.isSDKPathValid(sdkPath))
                return vscode_1.window.showErrorMessage('Invalid SDK path');
            // remember SDK for next time
            util.setSdkPath(sdkPath);
            // mix panel tracking
            let pluginMixPanel = new PluginMixPanel_1.default(isContext);
            pluginMixPanel.sendTracker(Constants_1.default.CREATE_WORKSPACE);
            // create workspace
            return AppManager_1.default.createWorkspace(this.tern, location, sdkPath);
        });
    }
}
exports.default = ExtJSWorkspace;
//# sourceMappingURL=ExtJSWorkspace.js.map