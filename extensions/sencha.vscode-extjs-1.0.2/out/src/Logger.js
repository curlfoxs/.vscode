'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require('winston');
const Platform_1 = require("./Platform");
const path = require("path");
const fs = require("fs");
var config = {
    levels: {
        silly: 0,
        verbose: 1,
        info: 2,
        data: 3,
        warn: 4,
        debug: 5,
        error: 6
    },
    colors: {
        silly: 'magenta',
        verbose: 'cyan',
        info: 'green',
        data: 'grey',
        warn: 'yellow',
        debug: 'blue',
        error: 'red'
    }
};
// clear log file
if (fs.existsSync(path.join(Platform_1.default.settingsDir, 'vscode-extjs.log'))) {
    fs.writeFileSync(path.join(Platform_1.default.settingsDir, 'vscode-extjs.log'), '');
}
var Logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true
        }),
        new (winston.transports.File)({
            filename: path.join(Platform_1.default.settingsDir, 'vscode-extjs.log'),
            json: false,
            handleExceptions: true
        })
    ],
    colorize: true,
    levels: config.levels,
    colors: config.colors,
    prettyPrint: true,
    exitOnError: false
});
module.exports = Logger;
//# sourceMappingURL=Logger.js.map