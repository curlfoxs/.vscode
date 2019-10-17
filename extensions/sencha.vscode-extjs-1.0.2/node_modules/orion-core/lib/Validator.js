"use strict";

var Validator = {
    _nameRe: /^[a-z_$@][a-z0-9_ ()$@\-]*$/i,

    name (value) {
        return Validator._nameRe.test(value);
    }
};

module.exports = Validator;
