"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Settings_1 = require("./Settings");
const DynamicsNAV_1 = require("./DynamicsNAV");
const WorkspaceFiles_1 = require("./WorkspaceFiles");
const SnippetFunctions_1 = require("./SnippetFunctions");
const fs = require("fs");
const NAVObject_1 = require("./NAVObject");
const path = require("path");
const MSDocs_1 = require("./MSDocs");
const Google_1 = require("./Google");
const CRSStatusBar = require("./UI/CRSStatusBar");
function InstallWaldosModules() {
    console.log('Running: InstallWaldosModules');
    vscode.window.showErrorMessage('This function has been temporarily disabled');
    console.log('Done: InstallWaldosModules');
}
exports.InstallWaldosModules = InstallWaldosModules;
function RunCurrentObjectWeb(currFile) {
    console.log('Running: RunCurrentObjectWeb');
    let currentdocument = currFile;
    if (!currentdocument) {
        currentdocument = vscode.window.activeTextEditor.document.uri;
    }
    let navObject = new NAVObject_1.NAVObject(fs.readFileSync(currentdocument.fsPath).toString(), Settings_1.Settings.GetConfigSettings(currentdocument), path.basename(currentdocument.fsPath));
    let objectId = navObject.objectType.toLowerCase().endsWith('extension') ? navObject.extendedObjectId : navObject.objectId;
    let objectType = navObject.objectType.toLowerCase().endsWith('extension') ? navObject.objectType.toLowerCase().replace('extension', '') : navObject.objectType;
    if (objectId) {
        DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objectType, objectId, 'WebClient');
    }
    console.log('Done: RunCurrentObjectWeb');
}
exports.RunCurrentObjectWeb = RunCurrentObjectWeb;
function RunObjectWeb() {
    console.log('Running: RunObjectWeb');
    vscode.window.showQuickPick(DynamicsNAV_1.DynamicsNAV.GetRunWebObjectTypesAsQuickPickItem()).then(objecttype => vscode.window.showInputBox({ prompt: 'ObjectID:' }).then(objectid => DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'WebClient')));
    console.log('Done: RunObjectWeb');
}
exports.RunObjectWeb = RunObjectWeb;
function RunTestTool() {
    console.log('Running: RunTestTool');
    DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient('Page', 130401, 'WebClient');
    console.log('Done: RunTestTool');
}
exports.RunTestTool = RunTestTool;
function RunEventSubscribers() {
    console.log('Running: RunEventSubscribers');
    DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient('Page', 9510, 'WebClient');
    console.log('Done: RunEventSubscribers');
}
exports.RunEventSubscribers = RunEventSubscribers;
function RunDatabaseLocks() {
    console.log('Running: RunDatabaseLocks');
    DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient('Page', 9511, 'WebClient');
    console.log('Done: RunDatabaseLocks');
}
exports.RunDatabaseLocks = RunDatabaseLocks;
function RunObjectTablet() {
    console.log('Running: RunObjectTablet');
    vscode.window.showQuickPick(DynamicsNAV_1.DynamicsNAV.GetRunWebObjectTypesAsQuickPickItem()).then(objecttype => vscode.window.showInputBox({ prompt: 'ObjectID:' }).then(objectid => DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'Tablet')));
    console.log('Done: RunObjectTablet');
}
exports.RunObjectTablet = RunObjectTablet;
function RunObjectPhone() {
    console.log('Running: RunObjectPhone');
    vscode.window.showQuickPick(DynamicsNAV_1.DynamicsNAV.GetRunWebObjectTypesAsQuickPickItem()).then(objecttype => vscode.window.showInputBox({ prompt: 'ObjectID:' }).then(objectid => DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'Phone')));
    console.log('Done: RunObjectPhone');
}
exports.RunObjectPhone = RunObjectPhone;
function RunObjectWindows() {
    console.log('Running: RunObjectWindows');
    vscode.window.showQuickPick(DynamicsNAV_1.DynamicsNAV.GetRunRTCObjectTypesAsQuickPickItem()).then(objecttype => vscode.window.showInputBox({ prompt: 'ObjectID:' }).then(objectid => DynamicsNAV_1.DynamicsNAV.RunObjectInWindowsClient(objecttype, objectid)));
    console.log('Done: RunObjectWindows');
}
exports.RunObjectWindows = RunObjectWindows;
function RenameCurrentFile() {
    console.log('Running: RenameCurrentFile');
    vscode.window.activeTextEditor.document.save().then(saved => {
        let oldFilename = vscode.window.activeTextEditor.document;
        let newFileName = WorkspaceFiles_1.WorkspaceFiles.RenameFile(oldFilename.uri);
        if (oldFilename.uri.fsPath != newFileName) {
            WorkspaceFiles_1.WorkspaceFiles.openRenamedFile(newFileName);
        }
    });
    console.log('Done: RenameCurrentFile');
}
exports.RenameCurrentFile = RenameCurrentFile;
function RenameAllFiles() {
    console.log('Running: RenameAllFiles');
    vscode.window.showWarningMessage('Are you sure to rename all files from all opened workspaces?', 'Yes', 'No').then((action) => {
        if (action === 'Yes') {
            WorkspaceFiles_1.WorkspaceFiles.RenameAllFiles();
            vscode.commands.executeCommand('workbench.action.closeAllEditors');
        }
    });
    console.log('Done: RenameAllFiles');
}
exports.RenameAllFiles = RenameAllFiles;
function ReorganizeCurrentFile() {
    console.log('Running: ReorganizeCurrentFile');
    vscode.window.activeTextEditor.document.save().then(saved => {
        let newFileName = WorkspaceFiles_1.WorkspaceFiles.ReorganizeFile(vscode.window.activeTextEditor.document.uri);
        vscode.workspace.openTextDocument(newFileName).then(doc => vscode.window.showTextDocument(doc));
    });
    console.log('Done: ReorganizeCurrentFile');
}
exports.ReorganizeCurrentFile = ReorganizeCurrentFile;
function ReorganizeAllFiles() {
    console.log('Running: ReorganizeAllFiles');
    vscode.window.showWarningMessage('Are you sure to reorganize all files from all opened workspaces?', 'Yes', 'No').then((action) => {
        if (action === 'Yes') {
            WorkspaceFiles_1.WorkspaceFiles.ReorganizeAllFiles();
            vscode.commands.executeCommand('workbench.action.closeAllEditors');
        }
    });
    console.log('Done: ReorganizeAllFiles');
}
exports.ReorganizeAllFiles = ReorganizeAllFiles;
function SearchMicrosoftDocs() {
    console.log('Running: SearchMicrosoftDocs');
    let currentword = vscode.window.activeTextEditor ? getWord(vscode.window.activeTextEditor) : "";
    vscode.window.showInputBox({ value: currentword, prompt: "Search String:" }).then(SearchString => MSDocs_1.MSDocs.OpenSearchUrl(SearchString));
    console.log('Done: SearchMicrosoftDocs');
}
exports.SearchMicrosoftDocs = SearchMicrosoftDocs;
function SearchGoogle() {
    console.log('Running: SearchGoogle');
    let currentword = vscode.window.activeTextEditor ? getWord(vscode.window.activeTextEditor) : "";
    vscode.window.showInputBox({ value: currentword, prompt: "Search String:" }).then(SearchString => Google_1.Google.OpenSearchUrl(SearchString));
    console.log('Done: SearchGoogle');
}
exports.SearchGoogle = SearchGoogle;
function SetupSnippets() {
    console.log('Running: SetupSnippets');
    SnippetFunctions_1.SnippetFunctions.SetupDefaultAlSnippets();
    SnippetFunctions_1.SnippetFunctions.SetupCRSAlSnippets();
    console.log('Done: SetupSnippets');
}
exports.SetupSnippets = SetupSnippets;
function HandleOnSaveTextDocument() {
    console.log('Running: HandleOnSaveTextDocument');
    WorkspaceFiles_1.WorkspaceFiles.renameFileOnSave();
    console.log('Done: HandleOnSaveTextDocument');
}
exports.HandleOnSaveTextDocument = HandleOnSaveTextDocument;
function HandleOnOpenTextDocument() {
    console.log('Running: HandleOnOpenTextDocument');
    CRSStatusBar.toggleRunObjectFromStatusBar();
    console.log('Done: HandleOnOpenTextDocument');
}
exports.HandleOnOpenTextDocument = HandleOnOpenTextDocument;
function getWord(editor) {
    const selection = editor.selection;
    const doc = editor.document;
    if (selection.isEmpty) {
        const cursorWordRange = doc.getWordRangeAtPosition(selection.active);
        if (cursorWordRange) {
            let newSe = new vscode.Selection(cursorWordRange.start.line, cursorWordRange.start.character, cursorWordRange.end.line, cursorWordRange.end.character);
            editor.selection = newSe;
            return editor.document.getText(editor.selection);
        }
        else {
            return '';
        }
    }
    else {
        return editor.document.getText(editor.selection);
    }
}
//# sourceMappingURL=CRSFunctions.js.map