'use strict';

var Task = require('../tasks/Task'),
    states = {
        notrunning: {
            running: false,
            error: false
        },
        running: {
            running: true,
            error: false
        },
        interrupted: {
            running: false,
            error: false
        },
        complete: {
            running: false,
            error: false
        },
        exception: {
            running: false,
            error: true
        }
    };

class CmdTask extends Task {

    constructor (cfg) {
        super(cfg);
        var me = this;
        me.lastLogLength = 0;
        me.state = 'NotRunning';

        me.description = me.description || me.id;
        me.app = me.app || null;
        me.record = me.record || null;
        me.running = me.running || null;
    }

    setState (state) {
        var me = this,
            stateWas = me.state,
            status = states[state.toLowerCase()],
            running = status.running;

        me._set('state', state);
        me._set('running', running);

        if (state != stateWas) {
            var statusWas = states[stateWas.toLowerCase()];
            if (status && statusWas) {
                if (running) {
                    me.fire('running');
                } else {
                    me.done();
                }
            }
        }
    }
    
    setCurrentTarget (target) {
        this._set('currentAntTarget', target);
    }

    update (update) {
        var me = this;
        me.status = update;
        if (update.logs && update.logs.length) {
            var logs = update.logs;
            for (var i = me.lastLogLength; i < logs.length; i++) {
                var log = logs[i];
                me.onLogMessage(log);
            }
            me.lastLogLength = logs.length;
        }
        if (update.description) {
            me.setDescription(update.description);
        }
        me.setState(update.state);
    }

    onLogMessage (message) {
        var me = this;
        message.taskId = me.id;
        message.description = me.description;
        me.fire({
            type: 'logMessage',
            message: message
        });
    }

    onAntEvent (message) {
        var me = this;
        message.description = me.description;
        this.fire({
            type: 'antEvent',
            message: message
        });
    }

    stop () {
        if (this.cmdClient) {
            this.cmdClient.stopTask(this).then(function(){});
        }
    }

    getRecordData () {
        var me = this,
            data = super.getRecordData();
        return Object.assign(data, {
            state: me.state
        });
    }
}

module.exports = CmdTask;