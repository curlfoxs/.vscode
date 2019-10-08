"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//import {fs} from fs;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const Settings_1 = require("./Settings");
const util_1 = require("util");
const NAVObject_1 = require("./NAVObject");
const Dictionary_1 = require("./Dictionary");
const git = require("./Git");
const CRSTerminal = require("./CRSTerminal");
const crsOutput = require("./CRSOutput");
class WorkspaceFiles {
    static getCurrentWorkspaceFolder() {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.workspace.workspaceFolders[0].uri);
        let activeTextEditorDocumentUri = null;
        try {
            activeTextEditorDocumentUri = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);
        }
        catch (error) {
            activeTextEditorDocumentUri = null;
        }
        if (activeTextEditorDocumentUri) {
            workspaceFolder = activeTextEditorDocumentUri;
        }
        return workspaceFolder;
    }
    static getCurrentWorkspaceFolderFromUri(filePath) {
        let workspaceFolder = vscode.workspace.getWorkspaceFolder(filePath);
        return workspaceFolder;
    }
    static getAlFilesFromCurrentWorkspace() {
        let activeTextEditorDocumentUri = this.getCurrentWorkspaceFolder();
        if (activeTextEditorDocumentUri) {
            return vscode.workspace.findFiles(new vscode.RelativePattern(activeTextEditorDocumentUri, '**/*.*'));
        }
        else {
            return vscode.workspace.findFiles('**/*.*');
        }
    }
    static RenameFile(fileName, withGit) {
        if (!fileName.toString().toLowerCase().endsWith('.al')) {
            return fileName.fsPath;
        }
        ;
        let settings = Settings_1.Settings.GetConfigSettings(fileName);
        let navObject = new NAVObject_1.NAVObject(fs.readFileSync(fileName.fsPath).toString(), settings, path.basename(fileName.fsPath));
        this.SaveAutoFixesToFile(fileName, navObject);
        if (navObject.objectFileName != navObject.objectFileNameFixed) {
            let newFilePath = path.join(path.dirname(fileName.fsPath), navObject.objectFileNameFixed);
            withGit = withGit ? withGit : (git.isGitRepositorySync() && settings[Settings_1.Settings.RenameWithGit]);
            this.DoRenameFile(fileName, newFilePath, withGit);
            return newFilePath;
            //console.log('renamed', fileName.fsPath, '-->', newFilePath);
        }
        else {
            //console.log('paths are the same.');
            return fileName.fsPath;
        }
    }
    static SaveAutoFixesToFile(fileName, navObject) {
        let FixedCode = navObject.NAVObjectTextFixed;
        if (navObject.NAVObjectText == FixedCode) {
            return null;
        }
        fs.writeFileSync(fileName.fsPath, FixedCode);
    }
    static ReorganizeFile(fileName, withGit) {
        if (!fileName.toString().toLowerCase().endsWith('.al')) {
            return fileName.fsPath;
        }
        ;
        let navObject = new NAVObject_1.NAVObject(fs.readFileSync(fileName.fsPath).toString(), Settings_1.Settings.GetConfigSettings(fileName), path.basename(fileName.fsPath));
        this.SaveAutoFixesToFile(fileName, navObject);
        let settings = Settings_1.Settings.GetConfigSettings(fileName);
        this.throwErrorIfReorgFilesNotAllowed(settings);
        let fixedname = navObject.objectFileNameFixed;
        if (navObject.objectFileName && navObject.objectFileName != '' && fixedname && fixedname != '') {
            let objectFolder = path.join(vscode.workspace.getWorkspaceFolder(fileName).uri.fsPath, this.getDestinationFolder(navObject, settings));
            let objectTypeFolder = path.join(objectFolder, this.getObjectTypeFolder(navObject));
            let objectSubFolder = path.join(objectTypeFolder, this.getObjectSubFolder(navObject));
            let destinationFileName = path.join(objectSubFolder, fixedname);
            if (destinationFileName.toLocaleLowerCase() == fileName.fsPath.toLocaleLowerCase()) {
                //console.log('paths are the same.');
                return fileName.fsPath;
            }
            else {
                (!fs.existsSync(objectFolder)) ? fs.mkdirSync(objectFolder) : '';
                (!fs.existsSync(objectTypeFolder)) ? fs.mkdirSync(objectTypeFolder) : '';
                (!fs.existsSync(objectSubFolder)) ? fs.mkdirSync(objectSubFolder) : '';
                withGit = withGit ? withGit : (git.isGitRepositorySync() && settings[Settings_1.Settings.RenameWithGit]);
                this.DoRenameFile(fileName, destinationFileName, withGit);
                //console.log('renamed', fileName.fsPath, '-->', destinationFileName);
                return destinationFileName;
            }
        }
        return fileName.fsPath;
    }
    static DoRenameFile(from, to, withGit) {
        if (!withGit) {
            fs.renameSync(from.fsPath, to);
            crsOutput.showOutput(`Rename file from ${from.fsPath.substr(from.fsPath.lastIndexOf('\\') + 1)} to ${to.substr(to.lastIndexOf('\\') + 1)}`);
        }
        else {
            git.gitMove(from, to);
        }
    }
    static RenameAllFiles() {
        vscode.workspace.saveAll();
        crsOutput.showOutput('Rename all files', true);
        let settings = Settings_1.Settings.GetConfigSettings(null);
        let withGit = (git.isGitRepositorySync() && settings[Settings_1.Settings.RenameWithGit]);
        this.getAlFilesFromCurrentWorkspace().then(Files => {
            let renamedfiles = new Dictionary_1.Dictionary();
            let totalFileCount = 0;
            let renamedFileCount = 0;
            try {
                Files.forEach(file => {
                    //console.log(file.fsPath);
                    totalFileCount++;
                    let newFilename = this.RenameFile(file, withGit);
                    if (file.fsPath != newFilename) {
                        renamedFileCount++;
                        renamedfiles.Add(file.fsPath, newFilename);
                    }
                });
                vscode.window.showInformationMessage(`${renamedFileCount} files out of ${totalFileCount} was renamed`);
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
            //WorkspaceFiles.ReopenFilesInEditor(renamedfiles);
        });
    }
    static ReorganizeAllFiles() {
        vscode.workspace.saveAll();
        crsOutput.showOutput('Reorganize all files', true);
        let settings = Settings_1.Settings.GetConfigSettings(null);
        let withGit = (git.isGitRepositorySync() && settings[Settings_1.Settings.RenameWithGit]);
        this.getAlFilesFromCurrentWorkspace().then(Files => {
            let renamedfiles = new Dictionary_1.Dictionary();
            try {
                let totalFileCount = 0;
                let renamedFileCount = 0;
                Files.forEach(file => {
                    totalFileCount++;
                    let newFilename = this.ReorganizeFile(file, withGit);
                    if (file.fsPath != newFilename) {
                        renamedFileCount++;
                        renamedfiles.Add(file.fsPath, newFilename);
                    }
                });
                vscode.window.showInformationMessage(`${renamedFileCount} files out of ${totalFileCount} was reorganized`);
            }
            catch (error) {
                vscode.window.showErrorMessage(error.message);
            }
            //WorkspaceFiles.ReopenFilesInEditor(renamedfiles);
        });
    }
    static ReopenFilesInEditor(renamedfiles) {
        let openfiles = new Array();
        vscode.workspace.textDocuments.forEach(doc => {
            if (doc.languageId != 'log') {
                if (renamedfiles.ContainsKey(doc.fileName)) {
                    openfiles.push(renamedfiles.Item(doc.fileName));
                }
                else {
                    openfiles.push(doc.fileName);
                }
            }
        });
        vscode.commands.executeCommand('workbench.action.closeAllEditors');
        openfiles.forEach(f => {
            vscode.workspace.openTextDocument(f).then(newdoc => vscode.window.showTextDocument(newdoc, { preserveFocus: true, viewColumn: vscode.ViewColumn.Active, preview: false }));
        });
    }
    static throwErrorIfReorgFilesNotAllowed(mySettings) {
        if (mySettings[Settings_1.Settings.AlSubFolderName] == 'None') {
            let errorMessage = "Configuration "
                + Settings_1.Settings.AlSubFolderName
                + " is set to 'None'.  Please choose another value for this function to work.";
            vscode.window.showErrorMessage(errorMessage);
            throw new util_1.error(errorMessage);
        }
    }
    static renameFileOnSave() {
        let currentfile = vscode.window.activeTextEditor.document.uri;
        if (!currentfile.fsPath.toLowerCase().endsWith('.al')) {
            return;
        }
        //vscode.window.activeTextEditor.document.save();
        let mySettings = Settings_1.Settings.GetConfigSettings(currentfile);
        let newFilePath;
        switch (mySettings[Settings_1.Settings.OnSaveAlFileAction].toLowerCase()) {
            case "rename":
                newFilePath = this.RenameFile(currentfile);
                break;
            case "reorganize":
                newFilePath = this.ReorganizeFile(currentfile);
                break;
            case "donothing":
                newFilePath = currentfile.fsPath;
                break;
        }
        if (newFilePath != currentfile.fsPath) {
            this.openRenamedFile(newFilePath);
        }
    }
    static openRenamedFile(newFilePath) {
        let currentEditor = vscode.window.activeTextEditor;
        let settings = Settings_1.Settings.GetConfigSettings(vscode.Uri.parse(newFilePath));
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        if (git.isGitRepositorySync && settings[Settings_1.Settings.RenameWithGit]) {
            CRSTerminal.OpenFileFromTerminal(newFilePath);
        }
        else {
            vscode.workspace.openTextDocument(newFilePath).then(doc => vscode.window.showTextDocument(doc).then(doc => this.setSelectionOnTextEditor(doc, currentEditor)));
        }
    }
    static setSelectionOnTextEditor(doc, editor) {
        //console.log('setSelectionOnTextEditor2');
        let currentSelection = editor.selection;
        let linecount = editor.document.lineCount - 1;
        let currentRange = editor.document.lineAt(currentSelection.active.line == linecount ? linecount : currentSelection.active.line + 1).range;
        doc.selection = currentSelection;
        doc.revealRange(currentRange);
    }
    static getDestinationFolder(navObject, mySettings) {
        if (navObject.objectCodeunitSubType) {
            if (navObject.objectCodeunitSubType.toLowerCase() == 'test') {
                return navObject.objectCodeunitSubType.toLowerCase();
            }
        }
        return mySettings[Settings_1.Settings.AlSubFolderName];
    }
    static getObjectTypeFolder(navObject) {
        if (navObject.objectCodeunitSubType) {
            if (navObject.objectCodeunitSubType.toLowerCase() == 'test') {
                return '';
            }
        }
        return navObject.objectType;
    }
    static getObjectSubFolder(navObject) {
        if (navObject.objectType == 'controladdin') {
            return navObject.objectNameFixedShort;
        }
        return "";
    }
}
exports.WorkspaceFiles = WorkspaceFiles;
//# sourceMappingURL=WorkspaceFiles.js.map