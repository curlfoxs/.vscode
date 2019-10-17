'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const vscode_1 = require("vscode");
const child_process_1 = require("child_process");
const path = require("path");
const os = require("os");
const Util_1 = require("./Util");
const events_1 = require("events");
const FileSystemWatcher_1 = require("./FileSystemWatcher");
const fs = require('fs');
const fetch = require('node-fetch');
const mkdirp = require('mkdirp');
const logger = require('./Logger');
const cjson = require('cjson');
let util = new Util_1.default();
const portRegex = /Listening on port (\d+)/i;
const pctCompleteRegex = /Indexing (\d+)% complete/i;
/**
 * Manages the sencha-tern process
 */
class TernManager extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        this.ready = false;
        this.configFile = vscode_1.workspace.rootPath && path.join(vscode_1.workspace.rootPath, '.sencha', 'ide', 'config.json');
    }
    /**
     * True if tern is running
     */
    get started() {
        return !!this.ternProcess;
    }
    /**
     * Starts sencha-tern on the current workspace
     */
    start() {
        if (this.ternProcess)
            return; // don't start if already started
        const args = [
            '--dir', vscode_1.workspace.rootPath,
            '--app', 'vscode',
            '--watchConfig', 'false',
            '--writeStatusFile', 'false'
        ];
        const ternPath = path.resolve(path.join(__dirname, '..', '..', 'node_modules', 'sencha-tern', 'bin', 'tern'));
        logger.log('info', `spawning tern: ${process.execPath} ${[ternPath].concat(args).join(' ')}`);
        this.ternProcess = child_process_1.spawn(process.execPath, [ternPath].concat(args), {});
        this.ternProcess.stdout.on('data', this.onTernOutput.bind(this));
        this.ternProcess.on('exit', this.onTernExit);
        this.watchPort();
        this.watchProgress();
        this.watchConfigFile();
        try {
            this.watcher = new FileSystemWatcher_1.default(this, vscode_1.workspace.rootPath);
        }
        catch (e) {
            logger.log('info', `error creating FileSystemWatcher: ${e.message}`);
        }
    }
    isReady() {
        return this.ready;
    }
    /**
     * Stops the tern process.
     */
    stop() {
        if (this.ternProcess) {
            this.ternProcess.kill('SIGTERM');
            console.log('Stopped tern.');
            logger.log('info', 'Stopped tern.');
        }
    }
    /**
     * Pauses watching for changes
     */
    pause() {
        if (this.watcher)
            this.watcher.pause();
    }
    /**
     * Resumes watching for changes
     */
    resume() {
        if (this.watcher) {
            this.watcher.resume();
            this.reindex();
        }
    }
    /**
     * Refreshes the index used for intellisense.
     * @param notify True to display a notification when reindexing is complete.
     */
    reindex(notify = false) {
        this.send({}, '/refresh');
        if (notify)
            this.once('refreshdone', () => vscode_1.window.showInformationMessage('Ext JS: Reindexing Complete'));
    }
    /**
     * Sends a request to tern
     * @param {Object} data The request body
     * @return A promise that resolves with tern's response
     */
    send(data, path = '') {
        return new Promise((resolve, reject) => {
            fetch(`${this.url}${path}`, {
                method: 'post',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(res => res.json())
                .then(json => resolve(json))
                .catch(e => reject(e));
        });
    }
    /**
     * Sends updated file contents to tern.
     * @param {vscode.TextDocument} document The file to send
     * @return {Promise<void>}
     */
    sendDocument(document) {
        return this.sendFile(document.fileName, document.getText());
    }
    /**
     * Sends updated file contents to tern.
     * @param {string} file The path to the file
     * @param {string} text The text content of the file
     * @return {Promise<void>}
     */
    sendFile(file, text) {
        return this.send({
            files: [{
                    type: 'full',
                    name: file,
                    text
                }]
        });
    }
    /**
     * Notifies tern that a file was deleted
     */
    sendDelete(file) {
        fetch(this.url, {
            method: 'post',
            body: JSON.stringify({
                files: [{
                        type: 'delete',
                        name: file
                    }]
            })
        });
    }
    /**
     * Watches for the creation of .tern-port in the workspace root so that we know which
     * port tern is listening on.
     */
    watchPort() {
        // proceed only if a valid workspace else display error message
        if (vscode_1.workspace.rootPath) {
            const tempDir = path.join(vscode_1.workspace.rootPath, '.sencha', 'temp', '.ide');
            mkdirp(tempDir, err => {
                fs.watch(tempDir, (event, file) => {
                    if (file === '.tern-port') {
                        fs.readFile(path.join(tempDir, '.tern-port'), 'utf8', (error, contents) => {
                            this.setPort(parseInt(contents));
                        });
                    }
                });
            });
        }
        else {
            return;
        }
    }
    /**
     * Watches .sencha/temp/.ide/status.json and displays the indexing status at the bottom
     * of the editor.
     */
    watchProgress() {
        if (vscode_1.workspace.rootPath) {
            const ideDir = path.join(vscode_1.workspace.rootPath, '.sencha', 'temp', '.ide');
            const statusFile = path.join(ideDir, 'status.json');
            mkdirp(ideDir, err => {
                if (err) {
                    logger.log('error', `Error creating ${ideDir}`);
                }
                fs.watch(ideDir, (event, file) => {
                    if (file === 'status.json') {
                        fs.readFile(statusFile, 'utf8', (error, contents) => {
                            if (contents && contents.length) {
                                const pctComplete = JSON.parse(contents).pctComplete;
                                this.updateProgress(pctComplete);
                            }
                        });
                    }
                });
            });
        }
    }
    /**
     * Displays the indexing progress in the status bar
     * @param {Number} pctComplete 0 to 100
     */
    updateProgress(pctComplete) {
        if (pctComplete === 100) {
            setTimeout(() => this.statusItem.hide(), 1000);
            this.emit('refreshdone');
            this.loadConfig();
        }
        else {
            this.statusItem.show();
        }
        this.statusItem.text = `Ext JS: ${pctComplete}% indexed`;
    }
    /**
     * Sets the port and url for the tern service
     * @param {Number} port The port on which tern is running
     */
    setPort(port) {
        this.url = `http://localhost:${port}`;
        this.ready = true;
        logger.log('info', `tern running at : ${this.url}`);
    }
    /**
     * Writes output from tern to the console
     */
    onTernOutput(data) {
        console.log('[tern]', data.toString());
        logger.log('info', '[tern output] - ' + data.toString());
        const port = (portRegex.exec(data) || [])[1];
        if (port)
            return this.setPort(parseInt(port));
        const pctComplete = (pctCompleteRegex.exec(data) || [])[1];
        if (pctComplete)
            return this.updateProgress(parseInt(pctComplete));
    }
    /**
     * Called when tern exits
     */
    onTernExit(code) {
        console.log('[tern]', `Exited with code ${code}`);
        logger.log('error', `[tern] Exited with code ${code}`);
    }
    /**
     * Identifies the OS and returns OS specific path for the tern executable
     * @returns {string} ternPath - OS specific tern executable path
     */
    getTernPath() {
        let osPlatform = os.platform();
        let ternProcessName = 'tern';
        if (osPlatform === 'win32') {
            if (process.arch === 'x64') {
                ternProcessName = 'tern-win64';
            }
            else if (process.arch === 'ia32') {
                ternProcessName = 'tern-win32';
            }
        }
        else if (osPlatform === 'darwin') {
            // do nothing
        }
        else {
            osPlatform = 'linux';
        }
        return path.resolve(path.join(__dirname, '..', '..', 'tern', osPlatform, ternProcessName));
    }
    /**
     * Resets tern when the config file is edited
     */
    watchConfigFile() {
        vscode_1.workspace.onDidSaveTextDocument(document => {
            if (document.fileName === this.configFile)
                this.reindex();
            this.loadConfig();
        });
    }
    /**
     * Returns true is in a directory listed in the exclude array of the intellisense config.
     * @param {String} file A file path
     */
    isExcluded(file) {
        return this.config &&
            this.config['exclude'] &&
            this.config['exclude'].some &&
            this.config['exclude'].some(excludedPath => file.toLowerCase().indexOf(excludedPath) === 0);
    }
    /**
     * Loads the intellisense config file.
     */
    loadConfig() {
        try {
            this.config = cjson.load(this.configFile);
            this.config['exclude'] = this.config['exclude'] && this.config['exclude'].map(p => path.resolve(vscode_1.workspace.rootPath, p).toLowerCase());
        }
        catch (e) {
            this.config = {};
        }
    }
}
exports.default = TernManager;
//# sourceMappingURL=TernManager.js.map