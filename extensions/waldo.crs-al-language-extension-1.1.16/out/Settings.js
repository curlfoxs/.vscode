"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path_1 = require("path");
class Settings {
    static getSetting(key) {
        if (!this.config.has(key)) {
            return null;
        }
        else {
            return this.config.get(key);
        }
    }
    static getConfigSettings(ResourceUri) {
        this.config = ResourceUri ?
            vscode.workspace.getConfiguration(this.WORKSPACEKEY, ResourceUri) :
            vscode.window.activeTextEditor ?
                vscode.workspace.getConfiguration(this.WORKSPACEKEY, vscode.window.activeTextEditor.document.uri) :
                vscode.workspace.getConfiguration(this.WORKSPACEKEY, null);
        this.SettingCollection[this.NstFolder] = this.getSetting(this.NstFolder);
        this.SettingCollection[this.ManagementModule] = this.joinPaths([this.SettingCollection[this.NstFolder], this.MANAGEMENTDLL]);
        this.SettingCollection[this.WebServerInstancePort] = this.getSetting(this.WebServerInstancePort);
        ;
        this.SettingCollection[this.WinServer] = this.getSetting(this.WinServer);
        this.SettingCollection[this.WinServerInstance] = this.getSetting(this.WinServerInstance);
        this.SettingCollection[this.WinServerInstancePort] = this.getSetting(this.WinServerInstancePort);
        this.SettingCollection[this.ExtensionObjectNamePattern] = this.getSetting(this.ExtensionObjectNamePattern);
        this.SettingCollection[this.FileNamePattern] = this.getSetting(this.FileNamePattern);
        this.SettingCollection[this.FileNamePatternExtensions] = this.getSetting(this.FileNamePatternExtensions);
        this.SettingCollection[this.FileNamePatternPageCustomizations] = this.getSetting(this.FileNamePatternPageCustomizations);
        this.SettingCollection[this.ObjectNamePrefix] = this.getSetting(this.ObjectNamePrefix);
        this.SettingCollection[this.ObjectNameSuffix] = this.getSetting(this.ObjectNameSuffix);
        this.SettingCollection[this.RemovePrefixFromFilename] = this.getSetting(this.RemovePrefixFromFilename);
        this.SettingCollection[this.RemoveSuffixFromFilename] = this.getSetting(this.RemoveSuffixFromFilename);
        this.SettingCollection[this.OnSaveAlFileAction] = this.getSetting(this.OnSaveAlFileAction);
        this.SettingCollection[this.AlSubFolderName] = this.getSetting(this.AlSubFolderName);
        this.SettingCollection[this.DisableDefaultAlSnippets] = this.getSetting(this.DisableDefaultAlSnippets);
        this.SettingCollection[this.DisableCRSSnippets] = this.getSetting(this.DisableCRSSnippets);
        this.SettingCollection[this.PublicWebBaseUrl] = this.getSetting(this.PublicWebBaseUrl);
        this.SettingCollection[this.RenameWithGit] = this.getSetting(this.RenameWithGit);
    }
    static getAppSettings(ResourceUri) {
        let appSettings = ResourceUri ?
            require(path_1.join(vscode.workspace.getWorkspaceFolder(ResourceUri).uri.fsPath, "app.json")) :
            vscode.window.activeTextEditor ?
                require(path_1.join(vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri).uri.fsPath, "app.json")) :
                require(path_1.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "app.json"));
        this.SettingCollection[this.AppName] = appSettings.name;
    }
    static getLaunchSettings(ResourceUri) {
        this.launchconfig = ResourceUri ?
            vscode.workspace.getConfiguration('launch', ResourceUri) :
            vscode.window.activeTextEditor ?
                vscode.workspace.getConfiguration('launch', vscode.window.activeTextEditor.document.uri) :
                vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders[0].uri);
        let currentLaunchConfig = this.launchconfig.configurations;
        this.SettingCollection[this.WebServer] = currentLaunchConfig[0].server;
        this.SettingCollection[this.WebServerInstance] = currentLaunchConfig[0].serverInstance;
        this.SettingCollection[this.Tenant] = currentLaunchConfig[0].tenant ? currentLaunchConfig[0].tenant : "default";
        this.SettingCollection[this.DefaultRunObjectType] = currentLaunchConfig[0].startupObjectType;
        this.SettingCollection[this.DefaultRunObjectId] = currentLaunchConfig[0].startupObjectId;
    }
    static GetAllSettings(ResourceUri) {
        this.getConfigSettings(ResourceUri);
        this.getAppSettings(ResourceUri);
        this.getLaunchSettings(ResourceUri);
        return this.SettingCollection;
    }
    static GetAppSettings(ResourceUri) {
        this.getAppSettings(ResourceUri);
        return this.SettingCollection;
    }
    static GetLaunchSettings(ResourceUri) {
        this.getLaunchSettings(ResourceUri);
        return this.SettingCollection;
    }
    static GetConfigSettings(ResourceUri) {
        this.getConfigSettings(ResourceUri);
        return this.SettingCollection;
    }
    static UpdateSetting(key, newvalue) {
        this.config.update(key, newvalue);
    }
    static joinPaths(paths) {
        for (let i = 0; i < paths.length; i++) {
            if (!paths[i] || paths[i] === "")
                return null;
        }
        return path_1.join.apply(null, paths);
    }
}
Settings.DefaultRunObjectType = 'DefaultRunObjectType';
Settings.DefaultRunObjectId = 'DefaultRunObjectId';
Settings.WebServer = 'WebServer';
Settings.WebServerInstance = 'WebServerInstance';
Settings.WebServerInstancePort = 'WebServerInstancePort';
Settings.WinServer = 'WinServer';
Settings.WinServerInstance = 'WinServerInstance';
Settings.WinServerInstancePort = 'WinServerInstancePort';
Settings.PublicWebBaseUrl = 'PublicWebBaseUrl';
Settings.Tenant = 'Tenant';
Settings.AppName = 'name';
Settings.NstFolder = 'nstfolder';
Settings.ManagementModule = 'managementmodule';
Settings.ExtensionObjectNamePattern = 'ExtensionObjectNamePattern';
Settings.FileNamePattern = 'FileNamePattern';
Settings.FileNamePatternExtensions = 'FileNamePatternExtensions';
Settings.FileNamePatternPageCustomizations = 'FileNamePatternPageCustomizations';
Settings.OnSaveAlFileAction = 'OnSaveAlFileAction';
Settings.ObjectNamePrefix = 'ObjectNamePrefix';
Settings.ObjectNameSuffix = 'ObjectNameSuffix';
Settings.RemovePrefixFromFilename = 'RemovePrefixFromFilename';
Settings.RemoveSuffixFromFilename = 'RemoveSuffixFromFilename';
Settings.DisableDefaultAlSnippets = 'DisableDefaultAlSnippets';
Settings.DisableCRSSnippets = 'DisableCRSSnippets';
Settings.RenameWithGit = 'RenameWithGit';
Settings.AlSubFolderName = 'AlSubFolderName';
Settings.SettingCollection = {};
Settings.WORKSPACEKEY = 'CRS';
Settings.MANAGEMENTDLL = 'Microsoft.Dynamics.Nav.Management.dll';
exports.Settings = Settings;
//# sourceMappingURL=Settings.js.map