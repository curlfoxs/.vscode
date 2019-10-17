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
const vscode = require("vscode");
const path = require("path");
const vscode_1 = require("vscode");
const Util_1 = require("./Util");
const { mkdirsSync } = require('fs-extra');
const SenchaCmd = require('sencha-cmd');
let outputChannel;
let util = new Util_1.default();
/**
 * Creates Apps, Workspaces, and Packages
 */
class AppManager {
    /**
     * Creates a workspace
     * @param {TernManager} tern - Tern instance
     * @param {String} location The location where the workspace is to be created
     * @param {String} sdk The path to the Ext JS sdk
     */
    static createWorkspace(tern, location, sdk) {
        return __awaiter(this, void 0, void 0, function* () {
            tern.pause();
            try {
                mkdirsSync(location);
                const result = yield this.runCmd('creating workspace...', ['-sdk', sdk, 'generate', 'workspace', '--path', location]);
                if (result.errors.length == 0) {
                    outputChannel.appendLine('Workspace created.');
                    this.promptOpenIfExternal(location, 'the new workspace');
                    return true;
                }
                else {
                    vscode_1.window.showErrorMessage("Workspace could not be created. See output at bottom for more information.");
                    return false;
                }
            }
            catch (e) {
                outputChannel.appendLine(`Error: ${e.message}`);
            }
            finally {
                tern.resume();
            }
        });
    }
    /**
     * Creates package(s).
     * @param {TernManager} tern - Tern instance
     * @param {string} packageType - Package type (code, theme, template, locale)
     * @param {string} packageName - name of the new package
     * @param {string} parentTheme - theme to extend
     */
    static createPackage(tern, packageType, packageName, workspaceLocation, parentTheme) {
        return __awaiter(this, void 0, void 0, function* () {
            tern.pause();
            try {
                let args = ['generate', 'package', '--type', packageType, '--name', packageName];
                if (packageType === 'theme')
                    args = [...args, '--extend', parentTheme];
                const result = yield this.runCmd('creating package...', args, workspaceLocation);
                if (result.errors.length == 0) {
                    outputChannel.appendLine(`Package ${packageName} created.`);
                    return true;
                }
                else {
                    vscode_1.window.showErrorMessage("Package could not be created. See output at bottom for more information.");
                    return false;
                }
            }
            catch (e) {
                outputChannel.appendLine(`Error: ${e.message}`);
            }
            finally {
                tern.resume();
            }
        });
    }
    /**
     * Creates universal, classic and modern app.
     * @param {string} toolkit - application type
     */
    static createApp({ tern, toolkit, sdk, name, location, theme }) {
        return __awaiter(this, void 0, void 0, function* () {
            tern.pause();
            try {
                mkdirsSync(location); // ensure the path to directory exists if it is nested
                const args = ['-sdk', sdk, 'generate', 'app', '--theme', theme, '--name', name, '--path', location];
                if (!util.isTouchSdk(sdk) && util.getMajorVersion(sdk) >= 6) {
                    switch (toolkit) {
                        case 'classic':
                            args.push('--classic');
                            break;
                        case 'modern':
                            args.push('--modern');
                            break;
                    }
                }
                const result = yield this.runCmd('creating app...', args, location);
                if (result.errors.length == 0) {
                    outputChannel.appendLine(`App ${name} created.`);
                    this.promptOpenIfExternal(location, name);
                }
                else {
                    vscode_1.window.showErrorMessage("App could not be created. See output at bottom for more information.");
                    return false;
                }
                return true;
            }
            catch (e) {
                outputChannel.appendLine(`Error: ${e.message}`);
            }
            finally {
                tern.resume();
            }
        });
    }
    /**
     * Runs sencha cmd with the specified arguments and displays the output at the bottom of the IDE
     * @param initMessage A message to add to the output at the start
     * @param args Args for sencha cmd
     * @param cwd The working directory in which to run cmd
     */
    static runCmd(initMessage, args, cwd = vscode_1.workspace.rootPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.clearOutputChannel(initMessage);
            const cmd = new SenchaCmd(args, { cwd });
            cmd.on('message', cmdMessage => outputChannel.appendLine(cmdMessage));
            cmd.on('error', cmdError => outputChannel.appendLine(cmdError));
            outputChannel.appendLine(`sencha ${args.join(' ')}`);
            return cmd.toPromise();
        });
    }
    /**
     * Displays a prompt asking the user if they would like to open the specified path if it exists
     * outside of the workspace rootPath.
     * @param location The directory to open
     * @param name What to call it
     */
    static promptOpenIfExternal(location, name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (location.indexOf(vscode_1.workspace.rootPath + path.sep) !== 0) {
                let yesBtn = { title: 'Yes' }, noBtn = { title: 'No' };
                const choice = yield vscode_1.window.showInformationMessage(`Would you like to open ${name} now?`, yesBtn, noBtn);
                if (choice.title === yesBtn.title) {
                    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(location));
                }
            }
        });
    }
    /**
     * Sets output channel to display sencha command messages / errors.
     */
    static clearOutputChannel(msg) {
        if (!outputChannel)
            outputChannel = vscode_1.window.createOutputChannel('Sencha Cmd');
        outputChannel.clear();
        outputChannel.show();
        if (msg)
            outputChannel.appendLine(msg);
        return outputChannel;
    }
}
exports.default = AppManager;
//# sourceMappingURL=AppManager.js.map