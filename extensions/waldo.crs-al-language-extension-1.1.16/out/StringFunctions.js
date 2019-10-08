"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DynamicsNAV_1 = require("./DynamicsNAV");
class StringFunctions {
    static replaceAll(str, find, replace) {
        return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
    }
    static escapeRegExp(str) {
        return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    }
    static removeAllButAlfaNumeric(str) {
        return str.replace(/\W/g, '');
    }
    static encloseInQuotesIfNecessary(str) {
        if (!str) {
            return str;
        }
        if (/[^a-zA-Z0-9]/.test(str) || DynamicsNAV_1.DynamicsNAV.isKeyWord(str)) {
            return "\"" + str + "\"";
        }
        else {
            return str;
        }
    }
}
exports.StringFunctions = StringFunctions;
//# sourceMappingURL=StringFunctions.js.map