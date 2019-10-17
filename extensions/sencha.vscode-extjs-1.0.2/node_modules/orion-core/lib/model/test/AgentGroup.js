"use strict";

var _idSeed = 0;

/**
 * Represents a group of Agents that all share the same UserAgent
 */
class AgentGroup {

    /**
     * @cfg {Number} id
     * A unique identifier for this agent group
     */

    /**
     * @cfg {Browser} [browser]
     * The browser associated with this agent group.  May be null for anonymous agent
     * groups (those not launched by a runner)
     */

    /**
     * @cfg {Pool} browserPool
     * The browser pool associated with this agent group
     */

    /**
     * @cfg {UserAgent} userAgent
     * The userAgent associated with this agent group. Only applicable for anonymous agent
     * groups that have no browser reference.
     */

    constructor(config) {
        Object.assign(this, config);

        this.isAgentGroup = true;

        /**
         * @property {Object} agents
         * A map of Agents in this group, keyed by Agent id
         */
        this.agents = {};

        /**
         * @property {Number} runningAgentCount
         * The number of agents currently running tests
         */
        this.runningAgentCount = 0;

        this.id = ++_idSeed;
    }

    /**
     * Adds an agent to this AgentGroup
     * @param {Agent} agent
     */
    add(agent) {
        this.agents[agent.id] = agent;
        agent.agentGroup = this;
    }

    /**
     * Removes an agent from this AgentGroup
     * @param {Agent/String} agent The Agent or id of the Agent to remove
     */
    remove(agent) {
        delete this.agents[agent.id || agent];
        agent.agentGroup = null;
    }

    /**
     * Returns the first agent in the group
     */
    firstAgent() {
        var agents = this.agents,
            id = Object.keys(agents)[0];

        return agents[id] || null;
    }

    /**
     * Returns the total number of agents in this group
     */
    count() {
        return Object.keys(this.agents).length;
    }
}

module.exports = AgentGroup;