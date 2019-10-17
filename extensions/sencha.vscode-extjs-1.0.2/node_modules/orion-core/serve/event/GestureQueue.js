/**
 * @class ST.event.GestureQueue
 * This class is used to queue asynchronous gesture events
 * @private
 */
ST.event.GestureQueue = ST.define({

    constructor: function (publisher) {
        this.publisher = publisher;
        this.queue = {};
        this.active = false;
        return this;
    },

    /**
     * @private
     * Adds gestures to the queue
     * @param {String} eventName The name of the event
     * @param {String} id The id of the event
     */
    add: function (eventName, id) {
        var me = this,
            queue = me.queue,
            eventName = eventName;
        // only add to the queue if this is active
        // this will prevent asynchronous events from getting added after runs are finished
        if (me.active) {
            if (!queue[eventName]) {
                queue[eventName] = {};
            }

            queue[eventName][id] = true;
        }
    },

    /**
     * @private
     * Completes the event cycle by removing the matching event id + type from the queue
     * @param {String} id The id of the event to remove
     * @param {String} type The type of event to remove
     * @return {Boolean} Returns true if a matching event was found and removed, otherwise false
     */
    complete: function (id, type) {
        var domain = this.queue[type];

        if (domain && domain[id]) {
            delete domain[id];

            return true;
        }

        return false;
    },

    /**
     * @private
     * Sets the queue to an active state, allowing events to be added
     */
    activate: function () {
        this.active = true;
    },

    /**
     * @private
     * Sets the queue to an inactive state, and clears the queue to a clean state
     */
    deactivate: function () {
        this.queue = {};
        this.active = false;
    }
});
