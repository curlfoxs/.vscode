"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var BoolDefault;
(function (BoolDefault) {
    BoolDefault["Enabled"] = "Enabled";
    BoolDefault["Disabled"] = "Disabled";
    BoolDefault["Default"] = "Default";
})(BoolDefault = exports.BoolDefault || (exports.BoolDefault = {}));
var BoolOption;
(function (BoolOption) {
    BoolOption["Enabled"] = "Enabled";
    BoolOption["Disabled"] = "Disabled";
})(BoolOption = exports.BoolOption || (exports.BoolOption = {}));
var GtagsSkipSymlinkOption;
(function (GtagsSkipSymlinkOption) {
    GtagsSkipSymlinkOption["None"] = "None";
    GtagsSkipSymlinkOption["File"] = "File";
    GtagsSkipSymlinkOption["Directory"] = "Directory";
    GtagsSkipSymlinkOption["All"] = "All";
})(GtagsSkipSymlinkOption = exports.GtagsSkipSymlinkOption || (exports.GtagsSkipSymlinkOption = {}));
class Config {
    constructor(section) {
        this.section = section;
    }
}
exports.Config = Config;
class TypedConfig extends Config {
    constructor(section, defaultValue) {
        super(section);
        this.defaultValue = defaultValue;
    }
}
exports.TypedConfig = TypedConfig;
class WindowScopeConfig extends TypedConfig {
    constructor(section, defaultValue) {
        super(section, defaultValue);
    }
    get() {
        return vscode.workspace.getConfiguration().get(this.section, this.defaultValue);
    }
}
exports.WindowScopeConfig = WindowScopeConfig;
class WindowScopeEnumConfig extends WindowScopeConfig {
    constructor(section, enumType, defaultValue) {
        super(section, defaultValue);
        this.enumType = enumType;
    }
    get() {
        return getEnumConfiguration(this.section, this.enumType, this.defaultValue);
    }
}
exports.WindowScopeEnumConfig = WindowScopeEnumConfig;
class ResourceScopeConfig extends TypedConfig {
    constructor(section, defaultValue) {
        super(section, defaultValue);
    }
    get(path) {
        return vscode.workspace.getConfiguration(undefined, path).get(this.section, this.defaultValue);
    }
}
exports.ResourceScopeConfig = ResourceScopeConfig;
class ResourceScopeEnumConfig extends ResourceScopeConfig {
    constructor(section, enumType, defaultValue) {
        super(section, defaultValue);
        this.enumType = enumType;
    }
    get(path) {
        return getEnumConfiguration(this.section, this.enumType, this.defaultValue, path);
    }
}
exports.ResourceScopeEnumConfig = ResourceScopeEnumConfig;
class GlobalConfiguration {
    constructor() {
        /* window scope configurations */
        this.globalExecutable = new WindowScopeConfig('gnuGlobal.globalExecutable', 'global');
        this.gtagsExecutable = new WindowScopeConfig('gnuGlobal.gtagsExecutable', 'gtags');
        this.encoding = new WindowScopeConfig('gnuGlobal.encoding', 'utf-8');
        this.objDirPrefix = new WindowScopeConfig('gnuGlobal.objDirPrefix', '');
        this.debugMode = new WindowScopeEnumConfig('gnuGlobal.debugMode', BoolOption, BoolDefault.Disabled);
        /* resource scope configurations */
        this.autoUpdate = new ResourceScopeEnumConfig('gnuGlobal.autoUpdate', BoolDefault, BoolDefault.Default);
        this.completion = new ResourceScopeEnumConfig('gnuGlobal.completion', BoolOption, BoolDefault.Enabled);
        this.libraryPaths = new ResourceScopeConfig('gnuGlobal.libraryPath', []);
        this.gtagsForceCpp = new ResourceScopeEnumConfig('gnuGlobal.gtagsForceCpp', BoolOption, BoolDefault.Disabled);
        this.gtagsSkipSymlink = new ResourceScopeEnumConfig('gnuGlobal.gtagSkipSymlink', GtagsSkipSymlinkOption, GtagsSkipSymlinkOption.None);
    }
}
exports.default = GlobalConfiguration;
/* Util function to get and check enum config */
function getEnumConfiguration(section, type, defaultValue, resource) {
    if (!(defaultValue in type)) {
        throw "BUG: type of default value doesn't match given type.";
    }
    const ret = vscode.workspace.getConfiguration(undefined, resource).get(section, defaultValue);
    if (ret in type) {
        return type[ret];
    }
    else {
        return type[defaultValue];
    }
}
//# sourceMappingURL=configuration.js.map