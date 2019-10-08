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
const path = require("path");
const fs = require("fs");
const crsOutput = require("./CRSOutput");
const WorkspaceFiles_1 = require("./WorkspaceFiles");
//var projectRoot = vscode.workspace.rootPath;
//var simpleGit = require('simple-git')((projectRoot) ? projectRoot : '.');
function isGitRepository(folder) {
    return __awaiter(this, void 0, void 0, function* () {
        return true; //TODO: Doesn't work in multiple workspaces
        if (folder.uri.scheme !== 'file') {
            return false;
        }
        const dotGit = path.join(folder.uri.fsPath, '.git');
        try {
            const dotGitStat = yield new Promise((c, e) => fs.stat(dotGit, (err, stat) => err ? e(err) : c(stat)));
            return dotGitStat.isDirectory();
        }
        catch (err) {
            return false;
        }
    });
}
exports.isGitRepository = isGitRepository;
function isGitRepositorySync() {
    return true; //TODO: Doesn't work in multiple workspaces
    let folder = WorkspaceFiles_1.WorkspaceFiles.getCurrentWorkspaceFolder();
    if (folder.uri.scheme !== 'file') {
        return false;
    }
    const dotGit = path.join(folder.uri.fsPath, '.git');
    try {
        return fs.statSync(dotGit).isDirectory();
    }
    catch (err) {
        return false;
    }
}
exports.isGitRepositorySync = isGitRepositorySync;
function gitMove(from, to) {
    let currentWorkspaceFolder = WorkspaceFiles_1.WorkspaceFiles.getCurrentWorkspaceFolderFromUri(from).uri.fsPath;
    const git = require('simple-git')(currentWorkspaceFolder);
    git.mv(from.fsPath, to, function (error) {
        if (error) {
            fs.renameSync(from.fsPath, to);
            crsOutput.showOutput(`*** Warning`, true);
            crsOutput.showOutput(`* ${error}`);
            crsOutput.showOutput(`* fallback: renaming without git from ${from.fsPath.substr(from.fsPath.lastIndexOf('\\') + 1)} to ${to.substr(to.lastIndexOf('\\') + 1)}`);
            crsOutput.showOutput(`* you might want to set the setting "crs.RenameWithGit" to false for this workspace.`);
            crsOutput.showOutput(`***`);
        }
        else {
            crsOutput.showOutput(`success: git mv ${from.fsPath.substr(from.fsPath.lastIndexOf('\\') + 1)} ${to.substr(to.lastIndexOf('\\') + 1)}`);
        }
    });
}
exports.gitMove = gitMove;
function fillFileList(status, fileList, is_gitadd = false) {
    console.log(status);
    status.modified.forEach(function (element) {
        var item = {
            'label': element,
            'description': "Modified"
        };
        fileList.push(item);
    }, this);
    status.not_added.forEach(function (element) {
        var item = {
            'label': element,
            'description': "Untracked"
        };
        fileList.push(item);
    }, this);
    if (!is_gitadd) {
        status.created.forEach(function (element) {
            var item = {
                'label': element,
                'description': "New"
            };
            fileList.push(item);
        }, this);
    }
    return fileList;
}
//# sourceMappingURL=Git.js.map