"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iconv = require("iconv-lite");
const logger_1 = require("../logger");
const spawnSync = require('child_process').spawnSync;
class ExecutableBase {
    constructor(configuration) {
        this.configuration = configuration;
    }
    /* Execute 'executable args' and return stdout with line split */
    execute(args, cwd = undefined, env = null) {
        const options = {
            cwd: cwd,
            env: env,
            encoding: 'binary'
        };
        let sync = spawnSync(this.executable, args, options);
        if (sync.error) {
            throw sync.error;
        }
        else if (0 != sync.status) {
            throw sync.stderr.toString();
        }
        logger_1.default.info(this.executable + " " + args + "\n" + sync.stdout);
        const encoding = this.configuration.encoding.get();
        return iconv.decode(Buffer.from(sync.stdout, 'binary'), encoding).split(/\r?\n/);
    }
}
exports.default = ExecutableBase;
//# sourceMappingURL=executableBase.js.map