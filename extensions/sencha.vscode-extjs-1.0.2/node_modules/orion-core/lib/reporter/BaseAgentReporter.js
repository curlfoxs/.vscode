"use strict";

var ReporterBase = require('./ReporterBase');

class BaseAgentReporter extends ReporterBase {

    runStarted (message) {
        this._runningAgentCounters = {
            // agentGroupId: count
        };
    }

    testRunStarted  (message){
        var me = this,
            agent = message.agent,
            agentGroup = agent.agentGroup,
            id = agentGroup && agentGroup.id,
            counters = me._runningAgentCounters,
            count;

        if (id) {
            counters[id] = (count = counters[id] || 0) + 1;

            if (count === 1) {
                if (me.agentGroupStarted) {
                    me.agentGroupStarted(agentGroup);
                }
            }
        }
    }

    testRunFinished (message){
        this._decrementRunningAgentCounter(message.agent);
    }

    agentTerminated (message) {
        this._decrementRunningAgentCounter(message.agent);
    }

    _decrementRunningAgentCounter(agent) {
        var me = this,
            agentGroup = agent.agentGroup,
            id = agentGroup && agentGroup.id,
            counters = me._runningAgentCounters,
            count;

        if (id && agent.isRunning && counters && counters[id]) {
            count = --counters[id];

            if (count === 0 && me.agentGroupFinished) {
                me.agentGroupFinished(agentGroup);
            }
        }
    }
}

module.exports = BaseAgentReporter;