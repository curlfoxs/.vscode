'use strict';

var BasicRunner = require('./BasicRunner');
var ReporterBase = require('../reporter/ReporterBase');

class EventRecorderReporter extends ReporterBase {
    constructor (cfg) {
        super(cfg);
        Object.assign(this, cfg);
        this.recordEnabledTests = [];
    }

    testRunStarted (message) {
        var agent = message.agent;
        this.runner.fire({
            type: 'testrunstarted',
            agent: agent,
            message: message
        });
    }

    testRunFinished (message) {
        var agent = message.agent;
        this.runner.fire({
            type: 'testrunfinished',
            agent: agent,
            message: message
        });
    }

    recordingStarted (message) {
        this.runner.fire('recordingstarted');
    }

    recordingStopped (message) {
        this.runner.fire('recordingstopped');
    }

    recordedEvents (message) {
        this.runner.fire({
            type: 'recordedevents',
            events: message.events
        });
    }

    testAdded (message) {
        var testDef = message.testDef;
        if (testDef.recording) {
            this.recordEnabledTests.push(testDef);
        }
    }

    afterFiles (message) {
        var agent = message.agent,
            len = this.recordEnabledTests.length;
        if (len === 0) {
            this.runner.fire({
                type: 'recordingerror',
                message: 'no recording enabled tests detected'
            });
        } else if (len > 1) {
            this.runner.fire({
                type: 'recordingerror',
                message: 'multiple recording enabled tests detected',
                tests: this.recordEnabledTests
            });
        } else {
            this.runner.recordAgent = agent;
            agent.startTestRun(null, this.recordEnabledTests.map(function(test){
                return test.id;
            }));
        }
    }

}

class EventRecorderRunner extends BasicRunner {
    ctor () {
        var me = this;

        me.isRecording = true;

        me.reporter = new EventRecorderReporter({
            runner: this
        });

        me.proxy.on({
            scope: me,
            single: true,
            started: function(event) {
                if (me.browser) {
                    me.launchLocalBrowser(me.browser.browser);
                }
            }
        });
    }
}

module.exports = EventRecorderRunner;
