'use strict';

const Base = require('orion-core/lib/Base');

class MessageValidator extends Base {

    validate(msg) {
        var type = msg.type;

        return !this[type] || this[type](msg);
    }

    testAdded(msg) {
        return true;
    }

    testSuiteEnter(msg) {
        return true;
    }

}

module.exports = MessageValidator;

