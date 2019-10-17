'use strict';
/**
 * A base class that provides life-cycle management, mixins and other features to derived
 * classes.
 *
 * ## Life-Cycle
 * The `Base` class defines a standard initialization and destruction sequence based on
 * two template methods: `ctor` and `dtor`. The initialization sequence is invoked by the
 * `Base` constructor and the destruction by the `destroy` method.
 *
 * This approach to life-cycle methods is designed to support simple inheritance as well
 * as mixins. That is, it ensures that the `ctor` methods for classes and mixins are always
 * called during construction and always in the correct, "top-down" order (from base to
 * derived). Similarly, the `destroy` method ensures that all `dtor` methods are called
 * for base classes and mixins. These are called in the reverse order to deconstruct the
 * object. Finally, in the presence of mixins, the `ctor` and `dtor` methods are called
 * only once for any given mixin or base class, even if these classes occur in the dreaded
 * "diamond" of inheritance.
 *
 * In general, derived classes then do not implement `constructor` or `destroy` methods.
 * For example:
 *
 *      class Foo extends Base {
 *          ctor () {
 *              console.log('Foo ctor');
 *          }
 *
 *          dtor () {
 *              console.log('Foo dtor');
 *          }
 *      }
 *
 *      class Bar extends Foo {
 *          ctor () {
 *              console.log('Bar ctor');
 *          }
 *
 *          dtor () {
 *              console.log('Bar dtor');
 *          }
 *      }
 *
 *      var obj = new Bar();
 *
 *      > Foo ctor
 *      > Bar ctor
 *
 *      obj.destroy();
 *
 *      > Bar dtor
 *      > Foo dtor
 *
 * ## Mixins
 * When a class implements a useful interface yet cannot be used as the base (typically
 * because another base must be used), a mixin allows a class to gain much of the same
 * benefit as inheritance.
 *
 * To provide this ability, `Base` uses a static class property called `meta`. The value
 * of this property is an object describing various aspects of the derived class (such as
 * mixins).
 *
 *      class Mixin extends Base {
 *          ctor () {
 *              console.log('Mixin ctor');
 *          }
 *
 *          dtor () {
 *              console.log('Mixin dtor');
 *          }
 *      }
 *
 *      class Jazz extends Bar {
 *          // This is the static "meta" property. This will be replaced by the
 *          // processed "meta" object when the class is first used.
 *          //
 *          static get meta () {
 *              return {
 *                  mixins: [
 *                      Mixin  // can be a constructor
 *
 *                      // or require()-able string w/default export of a constructor
 *                  ]
 *              };
 *          }
 *
 *          ctor () {
 *              console.log('Jazz ctor');
 *          }
 *
 *          dtor () {
 *              console.log('Jazz dtor');
 *          }
 *      }
 *
 *      var obj = new Jazz();
 *
 *      > Foo ctor
 *      > Bar ctor
 *      > Mixin ctor
 *      > Jazz ctor
 *
 *      obj.destroy();
 *
 *      > Jazz dtor
 *      > Mixin dtor
 *      > Bar dtor
 *      > Foo dtor
 *
 * ## The Meta Object
 * The `meta` object property is a (static) class property. If defined, the `meta`
 * object can have any of the following properties that will be recognized and processed
 * by `Base`. Once process, the property is replaced by the "final" meta object. This
 * object will have some properties replaced with more processed forms, but all other
 * properties will remain.
 *
 * ### mixinId
 * An id to use to identify a class when it is mixed in to other classes.
 *
 *      class Stuff extends Base {
 *          static get meta () {
 *              return {
 *                  mixinId: 'stuff'
 *              };
 *          }
 *
 *          method () {
 *          }
 *
 *          static staticMethod () {
 *          }
 *      }
 *
 *      class Thing extends Jazz {
 *          static get meta () {
 *              return {
 *                  mixins: [
 *                      Stuff
 *                  ]
 *              };
 *          }
 *
 *          method () {
 *              console.log('Jazz method');
 *
 *              this.mixins.stuff.method.call(this);
 *          }
 *
 *          static staticMethod () {
 *              console.log('Jazz staticMethod');
 *
 *              this.mixins.stuff.staticMethod.call(this);
 *          }
 *      }
 *
 *      var obj = new Thing();
 *
 *      obj.method();
 *
 *      Thing.staticMethod();
 *
 *
 * ### prototype
 * An object to be copied onto the class prototype.
 *
 * ### extended
 * A callback invoked when the class is extended. TODO NOT IMPLEMENTED
 *
 * ### mixed
 * A callback invoked when the class is mixed in to another class. TODO NOT IMPLEMENTED
 *
 * ### Futures
 * The following features of the Ext JS class system are potentially useful and could
 * be added in the future:
 *
 *  * alias (perhaps via a Factoryable base or mixin; timing will be an issue)
 *  * config (perhaps like Ext JS or perhaps with "Config" objects)
 *  * abstract
 *
 * ## Class Processing
 * Classes are processed "just in time". This can occur as late as the creation of the
 * first instance of the class. It will also happen when a class is mixed into another
 * class and that class is processed. Should it be necessary, a class can be processed
 * explicitly.
 *
 * For example:
 *
 *      class Stuff extends Base {
 *          static get meta () {
 *              return {
 *                  mixinId: 'stuff'
 *              };
 *          }
 *
 *          method () {
 *          }
 *
 *          static staticMethod () {
 *          }
 *      }
 *
 *      Stuff.decorate();  // decorate the Stuff class based on its "meta" data
 *
 * ## Non-Features
 * The following Ext JS class system features do not translate across and are not on
 * the list of future pieces to implement:
 *
 *  * extend              (provided by the class keyword)
 *  * private             (not critical and likely not needed)
 *  * requires            (use module system)
 *  * uses                (use module system)
 *  * override            (might be needed but would be very different)
 *  * alternateClassName  (class names are n/a)
 *  * statics             (provided by static keyword)
 *  * inheritableStatics  (all statics are inheritable)
 */
class Base {
    constructor (config) {
        var me = this;

        if (me.self !== me.constructor) {
            me.constructor.decorate();
        }

        me.initializing = true;
        me.$config = config;

        if (config) {
            Object.assign(this, config);
        }

        me.callChain('ctor', false);

        me.initializing = false;
        me.initialized = true;
    }

    destroy () {
        var me = this;

        me.destroy = Base.emptyFn;
        me.destroyed = true;

        me.destroying = true;

        me.callChain('dtor', true);

        me.destroying = false;

        return null;
    }

    callChain (method, reverse, args) {
        var classes = this.self.meta.classes,
            begin = 0,
            end = classes.length,
            incr = 1,
            noArgs = args === undefined,
            arrayArgs = !noArgs && args && args.length !== undefined && Array.isArray(args),
            cls, fn, i;

        if (reverse) {
            begin = end - 1;
            end = incr = -1;
        }

        for (i = begin; i !== end; i += incr) {
            if ((cls = classes[i].prototype).hasOwnProperty(method)) {
                fn = cls[method];

                if (noArgs) {
                    fn.call(this);
                } else if (arrayArgs) {
                    fn.apply(this, args);
                } else {
                    fn.call(this, args);
                }
            }
        }
    }

    reconfigure (config) {
        if (config) {
            Object.assign(this.$config, config);
            Object.assign(this, config);
        }
    }

    static construct (T, args) {
        var n = args ? args.length : 0,
            instantiator = instantiators[n] || (instantiators[n] = createInstantiator(n));

        return instantiator(T, args);
    }

    static create (args) {
        return Base.construct(this, arguments);
    };

    /**
     * @property {Object} [meta]
     * @static
     */
    static get meta () {
        return null;
    }

    static emptyFn () {
        // empty
    }

    static identityFn (x) {
        return x;
    }

    static decorate (meta) {
        var T = this,
            prototype = T.prototype,
            superclass = null,
            beginMixins, endMixins,
            c, classes, classMap, finalMeta, fn, i, mixinMap, n, name, properties,
            staticMixinMap, superClasses, superMeta;

        if (prototype.self === T) {
            return T;
        }

        beginMixins = endMixins = 0;
        prototype.self = T;
        classMap = {};
        mixinMap = {};
        staticMixinMap = {};

        if (T === Base) {
            classes = [];
        } else {
            superclass = Object.getPrototypeOf(T);
            if (!superclass.prototype.hasOwnProperty('self')) {
                superclass.decorate();
            }

            superMeta = superclass.meta;
            classes = (superClasses = superMeta.classes).slice();
            Object.assign(classMap, superMeta.classMap);
            Object.assign(mixinMap, superMeta.mixinMap);
            Object.assign(staticMixinMap, superMeta.staticMixinMap);
        }

        if (meta === undefined) {
            // If the user did not pass the class meta object, check for a static "meta"
            // property defined on the class itself.
            meta = T.meta;

            // Since class constructors in ES6 are prototype chained, the "meta" we find
            // may be coming from a decorated base class. We reject this case by checking
            // for the "class" property which is not provided by the user but is stamped
            // on the object we place on the constructor.
            if (meta && meta.class) {
                meta = null;
            }
        }

        prototype.mixins = mixinMap;
        T.mixins = staticMixinMap;

        finalMeta = {
            id: nextId++,
            class: T,
            superclass: superclass,

            classes: classes,
            classMap: classMap,
            mixinMap: mixinMap,
            staticMixinMap: staticMixinMap
        };

        // Replaced the "meta" property on the class. We have to use defineProperty() to
        // replace a "static get meta () {}" declaration.
        Object.defineProperty(T, 'meta', {
            value: finalMeta
        });

        if (meta) {
            for (name in meta) {
                if (!(name in finalMeta)) {
                    finalMeta[name] = meta[name];
                }
            }

            properties = meta.prototype;
            if (properties) {
                delete finalMeta.prototype;
                Object.assign(prototype, properties);
            }
            
            properties = meta.statics;
            if (properties) {
                delete finalMeta.statics;
                Object.assign(T, properties);
            }

            if (finalMeta.mixins) {
                // Capture the number of classes before mixing anything.
                beginMixins = classes.length;

                processMixins(T);

                // And now that we have done the mixins, the delta represents the
                // mixins we just mixed in.
                endMixins = classes.length;
            }
        }

        // The class itself is the final member of the classes/classMap.
        classMap[finalMeta.id] = T;
        classes.push(T);

        if (superClasses) {
            // Any classes in our superclass's classes list should be informed of the
            // extension. These will be our true base classes as well as any mixins.
            // Since mixins have already been informed of the mixed in status when they
            // were mixed in to our base, it is appropriate to inform them of this new
            // derived class as well.
            for (i = 0, n = superClasses.length; i < n; ++i) {
                fn = (c = superClasses[i]).meta.extended;
                if (fn) {
                    fn.call(c, T);
                }
            }
        }

        for (i = beginMixins; i < endMixins; ++i) {
            fn = (c = classes[i]).meta.mixed;
            if (fn) {
                fn.call(c, T);
            }
        }

        return T;
    }
}

var nextId = 1;
var instantiators = {};

var ignoreKeys = {
    _init: 1,
    _destroy: 1,
    init: 1,
    destroy: 1
};

Base.emptyFn.$nullFn = true;
Base.identityFn.$nullFn = true;
Base.prototype.isInstance = true;

function copyIf (dest, src, keys) {
    var i, k, n;

    if (keys) {
        for (i = 0, n = keys.length; i < n; ++i) {
            k = keys[i];
            if (!(k in dest)) {
                dest[k] = src[k];
            }
        }
    } else {
        for (k in src) {
            if (!(k in dest)) {
                dest[k] = src[k];
            }
        }
    }
}

function createInstantiator (numArgs) {
    var args = '',
        i;

    for (i = 0; i < numArgs; ++i) {
        args += (i ? ',' : '') + 'args[' + i + ']';
    }

    return new Function("T,args", "return new T(" + args + ");");
}

function getAllKeys (obj, stop) {
    var keys = [],
        map = {},
        i, key, n, names;

    for ( ; obj && obj !== stop; obj = Object.getPrototypeOf(obj)) {
        names = Object.getOwnPropertyNames(obj);

        for (i = 0, n = names.length; i < n; ++i) {
            key = names[i];

            if (!map[key]) {
                map[key] = true;
                keys.push(key);
            }
        }

    }

    return keys;
}

function processMixins (T) {
    var meta = T.meta,
        classes = meta.classes,  // list of all classes (super or mixin)
        classMap = meta.classMap,  // map of things in classes[] by meta.id
        mixins = meta.mixins,
        mixinMap = meta.mixinMap,
        staticMixinMap = meta.staticMixinMap,
        prototype = T.prototype,
        cls, clsMeta, index, mixin, i, id, keys, mixinClasses, mixinMeta, proto;

    for (index = 0; index < mixins.length; ++index) {
        mixin = mixins[index];
        if (typeof mixin === 'string') {
            mixins[index] = mixin = require(mixin);
        }

        if (!Base.isPrototypeOf(mixin)) {
            throw new Error('Mixin class must extend Base - ' + mixin.name);
        }

        // Make sure each mixin has been decorated before we try to include it.
        //
        if (mixin.prototype.self !== mixin) {
            mixin.decorate();
        }

        mixinMeta = mixin.meta;

        // If the mixin is not already in the list of classes[] (if it is, then all of
        // its bases and mixins are as well):
        //
        if (!classMap[mixinMeta.id]) {
            mixinClasses = mixinMeta.classes;

            // We process the "classes" of the mixin to properly fill out this class's
            // classes[] in topo order. We also fill out the maps by mixinId for any
            // mixins that we may be gaining (perhaps having been mixed in to these
            // mixins).
            for (i = 0; i < mixinClasses.length; ++i) {
                cls = mixinClasses[i];
                clsMeta = cls.meta;

                // Since the mixin has been decorated, we know all entries in its
                // classes[] have as well. Some of these may already be in our classes[]
                // but some may not.
                if (!classMap[clsMeta.id]) {
                    classMap[clsMeta.id] = cls;
                    classes.push(cls);

                    // Classes designed to be used as mixins can specify a "mixinId" in
                    // their meta block. This id is used to populate a map that classes
                    // can use to target the mixin and its prototype directly:
                    //
                    //      this.mixins.foo.method();  // "foo" is a mixinId
                    //
                    id = clsMeta.mixinId;
                    if (id && !mixinMap[id]) {
                        mixinMap[id] = cls.prototype;
                        staticMixinMap[id] = cls;
                    }
                }
            }

            // We cannot use for(in) loop here because class methods are not
            // enumerable.
            keys = getAllKeys(proto = mixin.prototype, Base.prototype);
            copyIf(prototype, proto, keys);

            keys = getAllKeys(mixin, Base);
            copyIf(T, mixin, keys);
        }
    }
}

Base.decorate();
module.exports = Base;

/*
class C extends Base {
    ctor (config) {
        console.log('C.ctor');
    }

    dtor () {
        console.log('C.dtor');
    }
}

class Mixin extends Base {
    static get meta () {
        return {
            mixinId: 'm'
        };
    }

    ctor (config) {
        console.log('Mixin.ctor');
    }

    dtor () {
        console.log('Mixin.dtor');
    }
}

class D extends C {
    static get meta () {
        return {
            // destroy
            // mixins
            // alias
            // config
            // onClassExtended
            // onClassMixedIn
            // abstract
            //
            // deprecated           ??
            //
            // extend               n/a
            // private              n/a
            // requires             n/a
            // uses                 n/a
            // override             n/a
            // alternateClassName   n/a
            // statics              n/a
            // inheritableStatics   n/a
            mixins: [
                Mixin
            ],

            prototype: {
                // properties that go on to the class prototype
            },

            extended: function (C) {
                //
            },

            mixed: function (Target) {
                //
            }
        };
    }

    ctor (config) {
        console.log('D.ctor');
    }

    dtor () {
        console.log('D.dtor');
    }
}

debugger;
var b = new D(42);
b.destroy();
b = new D(123);
b.destroy();
/**/
