"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration_1 = require("./configuration");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Info"] = 0] = "Info";
    LogLevel[LogLevel["Warning"] = 1] = "Warning";
    LogLevel[LogLevel["Error"] = 2] = "Error";
    LogLevel[LogLevel["Fatal"] = 3] = "Fatal";
})(LogLevel || (LogLevel = {}));
class Logger {
    // class members
    /*
     * A little bit ugly.
     * It's possible to register event to update log level, but it's not better.
     */
    constructor(configuration) {
        this.configuration = configuration;
    }
    static init(configuration) {
        this.instance = new Logger(configuration);
    }
    static fatal(message) {
        if (this.instance) {
            this.instance.log(LogLevel.Fatal, message);
        }
    }
    static error(message) {
        if (this.instance) {
            this.instance.log(LogLevel.Error, message);
        }
    }
    static warn(message) {
        if (this.instance) {
            this.instance.log(LogLevel.Warning, message);
        }
    }
    static info(message) {
        if (this.instance) {
            this.instance.log(LogLevel.Info, message);
        }
    }
    get level() {
        if (this.configuration.debugMode.get() === configuration_1.BoolOption.Enabled) {
            return LogLevel.Info;
        }
        else {
            return LogLevel.Fatal;
        }
    }
    log(level, message) {
        if (level >= this.level) {
            if (level == LogLevel.Warning) {
                console.warn("[jaycetyle.vscode-gnu-global]: " + message);
            }
            else if (level == LogLevel.Info) {
                console.info("[jaycetyle.vscode-gnu-global]: " + message);
            }
            else {
                console.error("[jaycetyle.vscode-gnu-global]: " + message);
            }
        }
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map