"use strict";

var Base = require('./Base');
var events = require('events');

/**
 * Usage
 *      class Foo extends Bar {
 *          static get meta () {
 *              return {
 *                  mixins: [
 *                      '../Observable.js'
 *                  ]
 *              };
 *          }
 *
 *          stuff () {
 *              var event = this.fire({
 *                  type: 'beforestuff',
 *                  foo: 42
 *              });
 *
 *              if (!event.cancel) {
 *                  moreStuff();
 *
 *                  this.fire({
 *                      type: 'stuff',
 *                      was: 42
 *                  });
 *              }
 *          }
 *      }
 */
class Observable extends Base {
    static get meta () {
        return {
            prototype: {
                isObservable: true
            }
        };
    }

    ctor () {
        var emitter = this.$emitter = new events.EventEmitter();
        // Node warns whenever we have more than 10 listeners
        emitter.setMaxListeners(0);
    }

    dtor () {
        this.fire({
            type: 'destroy',
            sender: this
        });

        this.$emitter.removeAllListeners();
        this.$emitter = null;
    }

    fire (event) {
        if (typeof event === 'string') {
            event = {
                type: event
            }
        }

        if (!event.sender) {
            event.sender = this;
        }

        this.$emitter.emit(event.type, event);

        return event;
    }

    getListenerCount (event) {
        return this.$emitter.listenerCount(event);
    }

    on (event, fn, scope) {
        var options = event,
            emitter = this.$emitter;

        if (typeof event === 'string') {
            if (!scope) {
                emitter.on(event, fn);
                return null;
            }

            options = {
                scope: scope
            };
            options[event] = fn;
        }

        return new Listener(this, options);
    }

    un (event, fn) {
        this.$emitter.removeListener(event, fn);
    }
}

var listenerOptions = {
    scope: 1,
    delay: 1,
    buffer: 1,
    managed: 1,
    single: 1
    //args: 1,
    //priority: 1,
    //order: 1  // 'before', 'after' (or number?)
};

class Listener {
    constructor (observable, options) {
        this.owner = observable;
        this.options = options;
        this.listenFns = {};

        this.process('doAdd');
    }

    destroy () {
        this.process('doRemove');

        var managed = this.managed,
            entry, i;

        if (managed) {
            for (i = managed.length; i-- > 0; ) {
                entry = managed[i];
                entry.instance.un('destroy', entry.fn);
            }

            managed.length = 0;
        }
    }

    process (method) {
        var me = this,
            options = me.options,
            event, fn, subOptions;

        for (event in options) {
            if (!(event in listenerOptions)) {
                fn = options[event];
                subOptions = (typeof fn === 'object') ? fn : null;

                if (subOptions) {
                    fn = subOptions.fn;
                }

                me[method](event, fn, options, subOptions);
            }
        }
    }

    doAdd (event, fn, options, subOptions) {
        var me = this,
            buffer = options.buffer,
            delay = options.delay,
            //order = options.order,
            managed = options.managed,
            scope = options.scope,
            single = options.single,
            listenFn = fn;

        if (subOptions) {
            buffer  = ('buffer'  in subOptions) ? subOptions.buffer  : buffer;
            delay   = ('delay'   in subOptions) ? subOptions.delay   : delay;
            managed = ('managed' in subOptions) ? subOptions.managed : managed;
            scope   = ('scope'   in subOptions) ? subOptions.scope   : scope;
            single  = ('single'  in subOptions) ? subOptions.single  : single;
            //order   = ('order'   in subOptions) ? subOptions.order   : order;
        }

        if (scope) {
            if (typeof listenFn === 'string') {
                if (typeof(listenFn = scope[listenFn]) !== 'function') {
                    throw new Error('No such method ' + fn);
                }
            }

            listenFn = listenFn.bind(scope);
            if (managed !== false && scope.on) {
                me.manage(scope, event);
            }
        }

        if (delay != null) {
            listenFn = me.wrapDelay(listenFn, delay);
        } else if (buffer != null) {
            listenFn = me.wrapBuffer(listenFn, buffer);
        }

        if (single) {
            listenFn = me.wrapSingle(event, listenFn);
        }

        me.listenFns[event] = listenFn;

        me.owner.on(event, listenFn);
    }

    doRemove (event) {
        var me = this,
            listenFns = me.listenFns,
            fn = listenFns[event];

        if (fn) {
            listenFns[event] = null;
            me.owner.un(event, fn);
        }
    }

    manage (instance, event) {
        var me = this,
            managed = (me.managed || (me.managed = [])),
            entry, i;

        for (i = managed.length; i-- > 0; ) {
            if (managed[i].instance === instance) {
                entry = managed[i];
                break;
            }
        }

        if (!entry) {
            managed.push(entry = {
                instance: instance,
                events: {}
            });

            instance.on('destroy', entry.fn = me.onManagedDestroy.bind(me, entry));
        }

        entry.events[event] = true;
    }

    onManagedDestroy (entry) {
        entry.instance.un('destroy', entry.fn);

        var managed = this.managed,
            index = managed.indexOf(entry),
            event;

        if (index >= 0) {
            managed.splice(index, 1);
        }

        for (event in entry.events) {
            this.doRemove(event);
        }
    }

    wrapBuffer (fn, buffer) {
        var caller = () => {
                var a = args;

                args = null;

                if (!a) {
                    fn();
                } else if (a.length === 1) {
                    fn(a[0]);
                } else {
                    fn.apply(null, a);
                }
            },
            args, id;

        // Don't use "() => {...}" here because that will capture arguments from this
        // outer context!
        return function () {
            args = arguments.length ? Array.prototype.slice.call(arguments) : null;

            if (id) {
                clearTimeout(id);
            }

            id = setTimeout(caller, buffer);
        };
    }

    wrapDelay (fn, delay) {
        // Don't use "() => {...}" here because that will capture arguments from this
        // outer context!
        return function () {
            var args = arguments;

            if (args.length) {
                args = Array.prototype.slice.call(args);
            } else {
                args = null;
            }

            setTimeout(() => {
                if (!args) {
                    fn();
                } else if (args.length === 1) {
                    fn(args[0]);
                } else {
                    fn.apply(null, args);
                }
            }, delay);
        };
    }

    wrapSingle (event, fn) {
        var me = this;

        // Don't use "() => {...}" here because that will capture arguments from this
        // outer context!
        return function () {
            me.doRemove(event);
            return fn.apply(null, arguments);
        };
    }
}

module.exports = Observable;

/*
class A extends Observable {
    constructor (id) {
        super();
        this.id = id;
    }

    foo () {
        this.fire({
            type: 'foo',
            value: this.id
        });
    }
}

class B extends Base {
    static get meta () {
        return {
            mixins: [
                Observable
            ]
        };
    }

    constructor (id) {
        super();
        this.id = id;
    }

    foo () {
        this.fire({
            type: 'foo',
            value: this.id
        });
    }
}

debugger;
var instance = B.create(42);
var bar = new Observable();
instance.on({
    foo: function (e) {
        debugger;
    },
    scope: bar
});
instance.foo();
bar.destroy();
instance.foo();

/**/
