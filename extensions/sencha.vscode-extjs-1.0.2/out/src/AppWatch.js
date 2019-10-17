/**
 * Extension to manage Sencha Cmd app watch process
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Util_1 = require("./Util");
const SenchaCmd = require('sencha-cmd');
let outputChannel;
let util = new Util_1.default();
/**
 * App Watch class
 */
class AppWatch {
    /**
     * Starts app watch
     * @param {string} path - app path returned by Tern
     * @param {boolean} withFashion - fashion support switch
     */
    static start(appPath, withFashion) {
        this.setChannel();
        this.showAppWatchItem();
        if (!this.isAppWatchOn) {
            this.cwd = appPath ? appPath : vscode.workspace.rootPath;
            try {
                if (withFashion) {
                    this.cmd = new SenchaCmd(['app', 'watch', '-fashion'], { cwd: this.cwd });
                }
                else {
                    this.cmd = new SenchaCmd(['app', 'watch'], { cwd: this.cwd });
                }
                outputChannel.appendLine('starting app watch ' + (withFashion ? 'with fashion' : '') + '...');
                this.cmd.start();
                this.cmd.on('message', m => outputChannel.appendLine(m));
                this.isAppWatchOn = true;
                this.cmd.on('error', error => {
                    outputChannel.appendLine(error);
                    this.isAppWatchOn = false;
                    this.hideAppWatchItem();
                });
            }
            catch (e) {
                console.log('error ', e);
            }
        }
        else {
            outputChannel.appendLine('app watch is running!');
        }
    }
    /**
     * Ends app watch
     */
    static stop() {
        this.setChannel();
        if (this.isAppWatchOn) {
            console.log('stopping app watch...');
            this.isAppWatchOn = false;
            this.cmd.stop();
            this.hideAppWatchItem();
            outputChannel.appendLine('app watched terminated');
        }
        else {
            outputChannel.appendLine('app watch not running');
        }
    }
    /**
     * Sets up an output channel
     */
    static setChannel() {
        if (!outputChannel) {
            console.log('creating output channel....');
            outputChannel = vscode.window.createOutputChannel('Sencha App Watch');
            outputChannel.show();
        }
        else {
            outputChannel.clear();
        }
    }
    /**
     * Sets app watch item on the status bar
     */
    static showAppWatchItem() {
        if (!this.appWatchItem) {
            this.appWatchItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.appWatchItem.text = "Stop App Watch";
            this.appWatchItem.command = "extension.vscode-extjs.stopAppWatch";
        }
        this.appWatchItem.show();
    }
    /**
     * Hides app watch item from status bar
     */
    static hideAppWatchItem() {
        if (this.appWatchItem) {
            this.appWatchItem.hide();
        }
    }
}
exports.default = AppWatch;
//# sourceMappingURL=AppWatch.js.map