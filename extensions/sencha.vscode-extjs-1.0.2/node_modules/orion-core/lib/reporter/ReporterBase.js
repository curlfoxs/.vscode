"use strict";

var Observable = require('../Observable');

class ReporterBase extends Observable {

    ctor (config) {
        Object.assign(this, config);

        this.supportedMessages = {
            agentAdded: 1,
            agentLaunched: 1,
            agentFailed: 1,
            agentRegistered: 1,
            agentTerminated: 1,
            beforeFiles: 1,
            afterFiles: 1,
            beforeFile: 1,
            afterFile: 1,
            runStarted: 1,
            testSuiteEnter: 1,
            testAdded: 1,
            testSuiteLeave: 1,
            testSuiteStarted: 1,
            testSuiteFinished: 1,
            testStarted: 1,
            testFinished: 1,
            testFailed: 1,
            testRunStarted: 1,
            testRunFinished: 1,
            recordingStarted: 1,
            recordingStopped: 1,
            recordedEvents: 1,
            systemError: 1,
            duplicateId: 1,
            codeCoverage: 1,
            codeCoverageStructure: 1
        };
    }

    dispatch (message) {
        var type = message.type;

        return this[type] && this[type](message);
    }
}

module.exports = ReporterBase;
