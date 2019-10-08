"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const executableBase_1 = require("./executableBase");
const configuration_1 = require("../configuration");
class Gtags extends executableBase_1.default {
    constructor(configuration) {
        super(configuration);
    }
    get executable() {
        return this.configuration.gtagsExecutable.get();
    }
    rebuildTags(folder) {
        var env = {};
        var opt = [];
        if (this.configuration.gtagsForceCpp.get(folder) === configuration_1.BoolOption.Enabled) {
            env.GTAGSFORCECPP = 1;
        }
        if (this.configuration.objDirPrefix.get() !== "") {
            env.GTAGSOBJDIRPREFIX = this.configuration.objDirPrefix.get();
            opt.push('-O');
        }
        if (this.configuration.gtagsSkipSymlink.get(folder) === configuration_1.GtagsSkipSymlinkOption.File) {
            opt.push('--skip-symlink=f');
        }
        else if (this.configuration.gtagsSkipSymlink.get(folder) === configuration_1.GtagsSkipSymlinkOption.Directory) {
            opt.push('--skip-symlink=d');
        }
        else if (this.configuration.gtagsSkipSymlink.get(folder) === configuration_1.GtagsSkipSymlinkOption.All) {
            opt.push('--skip-symlink=a');
        }
        this.execute(opt, folder.fsPath, env);
    }
}
exports.default = Gtags;
//# sourceMappingURL=gtags.js.map