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
/**
 * ExtJS Package Class. Sets up input prompts and then calls AppManager to create the package
 * @author Ritesh Patel
 */
class ExtJSPackage {
    /**
     * Constructor
     * @param {TernManager} tern - Tern instance
     */
    constructor(tern) {
        this.tern = tern;
    }
    /**
     * Sets up input prompts for creating a package and uses AppManager to create the package
     * @param {ExtensionContext} context - right click context
     */
    createPackage(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let util = new Util_1.default();
                let isContext = false;
                // retrieve sdk path from settings file
                const sdk = util.getSdkPath(vscode_1.workspace.rootPath);
                // Package Name
                const name = yield vscode_1.window.showInputBox({ "prompt": "Step 1 of 3: Specify package name", "ignoreFocusOut": true });
                if (!name)
                    return;
                if (name.trim().length === 0)
                    return vscode_1.window.showErrorMessage('Invalid package name');
                // Workspace Location
                const location = yield vscode_1.window.showInputBox({ prompt: "Step 2 of 3: Specify workspace location", value: (context && util.getWorkspacePath(context["fsPath"])) || util.getWorkspacePath(vscode_1.workspace.rootPath), ignoreFocusOut: true });
                if (!location)
                    return;
                let isWorkspace = util.isValidWorkspace(location); // check if valid workspace location
                if (!isWorkspace)
                    return vscode_1.window.showErrorMessage("Packages can only be created in Ext Application or Workspace root folder, or in 'packages' or 'packages\\local' folders");
                // Package Type
                const pkgType = yield vscode_1.window.showQuickPick(['code', 'theme', 'template'], { "placeHolder": "Step 3 of 3: Select package type" });
                if (!pkgType)
                    return;
                // Parent Theme
                let parentTheme = '';
                if (pkgType === 'theme') {
                    parentTheme = yield vscode_1.window.showQuickPick(util.getThemes(util.sdkForWorkspace(location), null, false), { "placeHolder": "Select parent theme" });
                    if (!parentTheme)
                        return;
                }
                // mix panel tracking
                let pluginMixPanel = new PluginMixPanel_1.default(context ? true : false);
                pluginMixPanel.sendTracker(Constants_1.default.CREATE_PACKAGE, { type: pkgType.toLowerCase() });
                // create the package
                return AppManager_1.default.createPackage(this.tern, pkgType, name, location, parentTheme);
            }
            catch (e) {
                vscode_1.window.showErrorMessage(e.message);
            }
        });
    }
}
exports.default = ExtJSPackage;
//# sourceMappingURL=ExtJSPackage.js.map