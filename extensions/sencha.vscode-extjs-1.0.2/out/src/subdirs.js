"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
function flatten(lists) {
    return lists.reduce(function (a, b) {
        return a.concat(b);
    }, []);
}
function subdirs(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}
exports.subdirs = subdirs;
/**
 * Returns all directories in srcpath
 * @param {String} srcpath The base directory to search
 * @return {String[]} A list of all nested directories
 */
function subdirsRecursive(srcpath) {
    return [srcpath, ...flatten(subdirs(srcpath).map(subdirsRecursive))];
}
exports.default = subdirsRecursive;
//# sourceMappingURL=subdirs.js.map