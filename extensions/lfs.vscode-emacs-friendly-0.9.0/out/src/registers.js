"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RegisterKind;
(function (RegisterKind) {
    RegisterKind[RegisterKind["KText"] = 1] = "KText";
    RegisterKind[RegisterKind["KPoint"] = 2] = "KPoint";
    RegisterKind[RegisterKind["KRectangle"] = 3] = "KRectangle";
})(RegisterKind = exports.RegisterKind || (exports.RegisterKind = {}));
;
class RectangleContent {
}
exports.RectangleContent = RectangleContent;
;
class RegisterContent {
    constructor(registerKind, registerContent) {
        this.kind = registerKind;
        this.content = registerContent;
    }
    static fromRegion(registerContent) {
        return new this(RegisterKind.KText, registerContent);
    }
    static fromPoint(registerContent) {
        return new this(RegisterKind.KPoint, registerContent);
    }
    static fromRectangle(registerContent) {
        return new this(RegisterKind.KRectangle, registerContent);
    }
    getRegisterKind() {
        return this.kind;
    }
    getRegisterContent() {
        return this.content;
    }
}
exports.RegisterContent = RegisterContent;
;
//# sourceMappingURL=registers.js.map