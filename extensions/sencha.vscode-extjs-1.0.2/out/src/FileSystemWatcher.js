"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const debounce = require("lodash.debounce");
const vscode_1 = require("vscode");
const re = /\.(js)$/;
/**
 * The max number of changes to queue before just restarting tern.
 */
const MAX_QUEUE_SIZE = 25;
class FileSystemWatcher {
    /**
     * @param ternManager
     * @param root The root directory of the project
     */
    constructor(tern, root) {
        this.indexQueue = new Set();
        this.rebuildIndex = false;
        this.paused = false;
        /**
         * Either flush all changes to tern or reindex the entire project if more than MAX_QUEUE_SIZE files have
         * changed.
         */
        this.flushIndexQueue = debounce(() => {
            if (this.rebuildIndex) {
                this.ternManager.reindex();
                this.rebuildIndex = false;
            }
            else {
                Promise.all(Array.from(this.indexQueue).map(filename => this.createTernData(filename)))
                    .then(files => this.ternManager.send({ files }));
            }
            this.indexQueue.clear();
        }, 500);
        this.ternManager = tern;
        this.root = root;
        this.startWatch();
        // this allows us to keep the index up to date event when file system events don't work, as in the case of network shares.
        vscode_1.workspace.onDidSaveTextDocument(document => this.addToIndexQueue(document.fileName));
    }
    /**
     * Adds the file to the queue of files to be indexed
     * @param filepath A full file path
     */
    addToIndexQueue(filepath, isDelete = false) {
        if (this.ternManager.isExcluded(filepath)) {
            return;
        }
        else if (this.paused || !filepath || (!isDelete && !re.test(filepath))) {
            return;
        }
        else if (this.indexQueue.size > MAX_QUEUE_SIZE) {
            this.rebuildIndex = true;
        }
        else {
            this.indexQueue.add(filepath);
        }
        this.flushIndexQueue();
    }
    /**
     * Stops watching for changes.
     */
    pause() {
        this.paused = true;
    }
    /**
     * Resumes watching for changes.
     */
    resume() {
        this.paused = false;
    }
    /**
     * Initiates watch the file system for changes
     */
    startWatch() {
        const watcher = vscode_1.workspace.createFileSystemWatcher('**/*');
        watcher.onDidChange(uri => this.addToIndexQueue(uri.path));
        // this gets called on both create and rename of files and directories
        watcher.onDidCreate(uri => this.addToIndexQueue(uri.path));
        // this gets called on both delete and rename of files and directories
        watcher.onDidDelete(uri => this.addToIndexQueue(uri.path, true));
    }
    createTernData(filename) {
        return new Promise((resolve, reject) => {
            fs_1.exists(filename, (exists) => {
                if (exists) {
                    fs_1.readFile(filename, 'utf8', (error, contents) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve({ name: filename, text: contents, type: 'full' });
                        }
                    });
                }
                else {
                    resolve({ name: filename, type: 'delete' });
                }
            });
        });
    }
}
exports.default = FileSystemWatcher;
//# sourceMappingURL=FileSystemWatcher.js.map