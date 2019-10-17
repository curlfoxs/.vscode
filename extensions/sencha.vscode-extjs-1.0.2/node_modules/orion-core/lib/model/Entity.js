"use strict";

var Base = require('../Base');
var Json = require('orion-core/lib/Json');
var xfs = require('../xfs.js');
var Util = require('../Util');

var fs = require('fs');
var Path = require('path');

/**
 * This class implements a basic data entity. Many (but not all) records have associated
 * JSON data files from which they are loaded. This class also provides the basic loader
 * for this.
 */
class Entity extends Base {
    constructor (data) {
        super({
            data: data || {}
        });
    }

    clone () {
        var C = this.constructor,
            c = new C(Util.clone(this.data));

        c.setSourceFile(this.sourceFile);
        return c;
    }

    /**
     * Copies a list of `properties` from the specified `src`.
     * @param {Object} src The object whose values are to be copied to this entity.
     * @param {String/String[]} properties The names (array or comma-separated) of the
     * properties to copy from `src`.
     * @chainable
     */
    copyFrom (src, properties) {
        if (typeof properties === 'string') {
            properties = properties.split(',');
        }

        var nullable, sn, dn, k, v, i;

        for (i = properties.length; i-- > 0; ) {
            sn = dn = properties[i];
            nullable = sn.endsWith('?');
            if (nullable) {
                sn = dn = sn.substring(0, sn.length - 1);
            }

            if ((k = sn.indexOf('->')) > 0) {   // src->dest
                sn = sn.substring(0, k);
                dn = dn.substring(k+2);
            } else if ((k = sn.indexOf('<-')) > 0) {    // dest<-src
                dn = dn.substring(0, k);
                sn = sn.substring(k+2);
            }

            if (sn in src) {
                v = src[sn];

                if (nullable && (v === null || v === '')) {
                    v = undefined;
                }

                this.set(dn, v);
            }
        }

        return this;
    }

    /**
     * Returns the value given its name.
     *
     *      var name = entity.get('name');
     *
     * Can also return multiple values in an object:
     *
     *      var data = entity.get([ 'name', 'value' ]);
     *
     *      // data = {
     *      //    name: entity.get('name'),
     *      //    name: entity.get('value')
     *      // };
     *
     * Alternatively:
     *
     *      var newData = {
     *          name: 'Foo',
     *          value: 42
     *      };
     *
     *      var oldData = entity.get(newData);
     *
     *      // data = {
     *      //    name: entity.get('name'),
     *      //    name: entity.get('value')
     *      // };
     *
     *      entity.set(newData);  // object form is supported to match w/set()
     *
     * @param {String/String[]/Object} name
     */
    get (name) {
        var data = this.data,
            i, ret;

        if (typeof name === 'string') {
            ret = data[name];
        }
        else {
            ret = {};

            if (!Array.isArray(name)) {
                name = Object.keys(name);
            }

            for (i = name.length; i-- > 0; ) {
                ret[name[i]] = this.get([name[i]]);
            }
        }

        return ret;
    }

    getId () {
        return this.data.id;
    }

    getName () {
        return this.name || this.data.name || this.relativePath || this.baseName || '';
    }

    setName (name) {
        this.set('name', name);
    }

    setOwner (owner) {
        this.owner = owner;
    }

    getPersistData () {
        return this.data;
    }

    getWorkspace () {
        if (this.isWorkspace) {
            return this;
        }

        if (this.workspace) {
            return this.workspace;
        }

        if (this.owner) {
            return this.owner.getWorkspace();
        }

        return null;
    }

    /**
     * Loads all children of this record and returns a promise that will resolve to this
     * instance once the loads are complete.
     *
     * @return {Promise<Entity>} A promise resolving to this once all child items are
     * loaded.
     */
    loadChildren () {
        return Promise.resolve(this);
    }

    resolve () {
        var args = Array.prototype.slice.call(arguments, 0),
            base = args.length && args[0];

        if (base) {
            args[0] = this.resolveVariables(base);
        }

        args.unshift(this.dir);

        return Path.resolve.apply(Path, args);
    }

    resolveVariables (path) {
        var owner = this.owner;

        return owner ? owner.resolveVariables(path) : path;
    }

    save () {
        var me = this,
            data, json;

        if (me.error) {
            throw new Error('Cannot save this entity');
        }

        data = me.getPersistData();
        json = JSON.stringify(data, null, 4) + "\n";

        return xfs.writeFile(me.sourceFile, json).then(function () {
            return me;
        });
    }

    /**
     * Sets one or more properties on this object.
     * @param {String/Object} name The name of the property to set or an object of names
     * and values to set.
     * @param {Mixed} value The value of `name` if `name` is a string. Otherwise this
     * argument is ignored.
     * @return {Mixed} The previous value if `name` is a string, otherwise `null`.
     */
    set (name, value) {
        var me = this,
            data = me.data,
            was = null;

        if (typeof name === 'string') {
            was = data[name];

            if (value === undefined) {
                delete data[name];
            } else {
                data[name] = value;

                if (name === 'name' && 'name' in me) {
                    me.name = name;
                }
            }
        } else {
            for (var key in name) {
                me.set(key, name[key]);
            }
        }

        return was;
    }

    setRelativePath (relPath) {
        relPath = (relPath || '').replace(/[\\]/g, '/');
        if (relPath.charAt(0) === '/') {
            relPath = relPath.substring(1);
        }

        this.relativePath = relPath;
    }

    setSourceFile (jsonFile) {
        if (jsonFile) {
            this.sourceFile = this.path = jsonFile;
            this.dir = Path.resolve(jsonFile, '..');
            this.baseName = Path.basename(this.dir);
        }
    }

    /**
     * Loads an entity of this type from the specified JSON file. During the load of
     * the entity, child entities may be loaded as well via `loadChildren`. In order to
     * preserve as much as can be loaded, the promise returned by this method will never
     * "reject". Errors are stored as an `error` property on any entity that fails to
     * load for some reason.
     *
     * All entities loaded in this way can use the `save` method to write their data
     * back to the JSON file. They will also have a `sourceFile` property that tracks
     * the path from which they were loaded.
     *
     * @param {String} jsonFile
     * @param {Entity} [owner] The owning entity of the entity being loaded.
     * @param {Boolean} [deep] Pass `false` to skip loading child entities.
     * @return {Promise<Entity>} A Promise that resolves to an instance of this type.
     */
    static load (jsonFile, owner, deep) {
        var Type = this;

        if (jsonFile.$isFile) {
            jsonFile = jsonFile.path;  // unbox a File object
        }
        if (typeof owner === 'boolean') {
            deep = owner;
            owner = null;
        }

        return new Promise(function (resolve, reject) {
            if (!jsonFile.endsWith('.json')) {
                jsonFile = Path.join(jsonFile, Type.jsonName);
            }

            var dir = Path.resolve(jsonFile, '..');

            fs.readFile(jsonFile, 'utf8', function (error, content) {
                var instance;

                if (error) {
                    instance = new Type();
                    if (owner) {
                        instance.setOwner(owner);
                    }
                    instance.setSourceFile(jsonFile);
                    instance.error = new Error('Directory is not a valid ' +
                        Type.kind + ': ' + dir);

                    resolve(instance);
                } else {
                    try {
                        instance = new Type(Json.parse(content));
                        if (owner) {
                            instance.setOwner(owner);
                        }
                        instance.setSourceFile(jsonFile);

                        if (deep === false) {
                            resolve(instance);
                        } else {
                            instance.loadChildren().then(resolve, function (e) {
                                instance.error = e;
                                resolve(instance);
                            });
                        }
                    } catch (e) {
                        instance = new Type();
                        if (owner) {
                            instance.setOwner(owner);
                        }
                        instance.setSourceFile(jsonFile);
                        instance.error = e;

                        resolve(instance);
                    }
                }
            });
        });
    }

    static nextId () {
        var id = this._idSeed || 0;

        return this._idSeed = ++id;
    }
}

module.exports = Entity;
