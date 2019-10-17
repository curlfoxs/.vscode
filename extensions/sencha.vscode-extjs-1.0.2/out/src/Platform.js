"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const child_process_1 = require("child_process");
const mkdirp = require('mkdirp');
class Platform {
    constructor() {
        /**
         * Returns the user's home folder based on their OS
         */
        this.home = process.env.HOME || process.env.USERPROFILE;
    }
    /**
     * Returns the directory where user setting are stored
     */
    get settingsDir() {
        if (this._settingsDir)
            return this._settingsDir;
        switch (os.platform()) {
            case 'win32':
                this._settingsDir = path.join(process.env.USERPROFILE, '.sencha', 'VSCode');
                break;
            case 'darwin':
                this._settingsDir = path.join(process.env.HOME, 'Library', 'Application Support', 'Sencha', 'VSCode');
                break;
            case 'linux':
                this._settingsDir = path.join(process.env.HOME, '.local', 'share', 'data', 'Sencha', 'VSCode');
                break;
            default:
                throw 'Platform is not supported!';
        }
        mkdirp.sync(this._settingsDir);
        return this._settingsDir;
    }
    /**
     * Returns the name of the OS file manager
     */
    get finderName() {
        if (os.platform() === 'darwin') {
            return 'Finder';
        }
        else {
            return 'Explorer';
        }
    }
    /**
     * Shows the specified directory or file in the OS file manager
     * @param dir The directory or file to show
     */
    revealInFinder(dir) {
        let cmd;
        switch (os.platform()) {
            case 'darwin':
                cmd = `open "${dir}"`;
                break;
            case 'linux':
                cmd = `gnome-open "${dir}"`;
                break;
            default:
                cmd = `start "" "${dir}"`;
        }
        child_process_1.exec(cmd);
    }
}
exports.default = new Platform();
//# sourceMappingURL=Platform.js.map