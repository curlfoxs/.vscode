"use strict";

var CodeBase = require('./CodeBase');

var fs = require('fs');
var Path = require('path');
var xfs = require('orion-core/lib/xfs');
var File = require('orion-core/lib/fs/File');
var Strings = require('orion-core/lib/Strings');

/**
 * This class manages a Package definition.
 */
class Package extends CodeBase {
    static get meta () {
        return {
            prototype: {
                isPackage: true
            }
        };
    }

    loadChildren () {
        var me = this;

        return super.loadChildren().then(() => {
            var packages = me.get('subpkgs'),
                configFile = me.configFile,
                dir;

            // The "subpkgs" config can appear in package.json as a String/String[]
            packages = typeof packages === 'string' ? packages.split(',') : packages;

            if (configFile) {
                if (!packages) {
                    // Or, in the sencha.cfg file as a comma-separated String.
                    packages = configFile.get('package.subpkgs');
                    packages = packages && packages.split(',');
                }
                if (packages) {
                    // The base dir for subpkgs is also a config but presently is
                    // not found in package.json.
                    dir = configFile.get('package.subpkgs.dir') || '';
                    packages = packages.map(it => Path.join(dir, it));
                }
            }

            if (packages && packages.length) {
                return Package.loadAll(packages, me).then(function (pkgs) {
                    me.packages = pkgs;
                    if (pkgs && me.workspace) {
                        pkgs.forEach(pkg => pkg.setWorkspace(me.workspace));
                    }
                    return me;
                }, function (e) {
                    debugger;
                });
            }

            return me;
        });
    }

    resolveVariables (path) {
        return super.resolveVariables(path).split('${package.dir}').join(this.dir);
    }

    setSourceFile (path) {
        super.setSourceFile(path);

        if (this.data.dependencies) {
            this.error = new Error('Node modules are not Sencha Cmd packages: ' + path);
        }
    }

    //-------------------------------------------------------------------
    // Static

    static get configPath () { return '.sencha/package/sencha.cfg'; }

    static get jsonName () { return 'package.json'; }

    static get kind () { return 'Package'; }

    /**
     * Accepts a file name or directory location and resolves to a single `File` or an
     * array of `File`. If `fileOrDir` is a single package, a `File` object is resolved.
     * If `fileOrDir` is a folder of packages, a `File[]` is resolved for each package
     * json file. All resolved `File` instances have the `stat` property (see `fs.Stats`)
     * or `false`.
     *
     * @param {String|File} fileOrDir
     * @return {Promise<File|File[]>}
     */
    static grok (fileOrDir) {
        var me = this,
            file;

        fileOrDir = File.get(fileOrDir);  // ensure we have a File

        if (fileOrDir.path.endsWith(me.jsonName)) {
            // With a single file, we just stat() it and resolve that object with its
            // "stat" property populated. Will be `false` if the file does not exist.
            return fileOrDir.getStat().then(function (stat) {
                fileOrDir.stat = stat;
                return fileOrDir;
            });
        }

        // Must be a directory name, but might be a "packages" folder (with zero
        // or more package sub-folders) or one of those sub-folders. First check for
        // the simple case of a package folder.
        //
        file = fileOrDir.join(me.jsonName);

        return new Promise(function (resolve) {
            file.getStat().then(function (stats) {
                if (stats === false) {
                    // If we stat "packages/package.json" it will end up here, so
                    // we most likely have a directory of packages. It is also a
                    // valid thing for this path to simply not exist.
                    fileOrDir.getFiles().then(function (files) {
                        var result = [],
                            promises = [];

                        files.forEach(function (f) {
                            if (f.stat.isDirectory()) {
                                // We include "package.json" here in case we need to
                                // re-grok things. We don't want infinite recursion
                                // into folders that aren't package containers.
                                result.push(f = f.join(me.jsonName));

                                promises.push(f.getStat().then(function (st) {
                                    if (st === false) {
                                        // If a folder in a package container does not
                                        // have a "package.json" in it, we skip it. It
                                        // is likely an arrangement like "packages" and
                                        // "packages/local" or "packages/remote". The
                                        // top-level folder is kept in the search path
                                        // but these sub-folders are ignored.
                                        let index = result.indexOf(f);
                                        result.splice(index, 1);
                                    } else {
                                        f.stat = st;
                                    }
                                }));
                            }
                        });

                        Promise.all(promises).then(function () {
                            resolve(result);
                        });
                    }, function (e) {
                        // We cannot list the content of fileOrDir so it probably
                        // just doesn't exist.
                        resolve(null);
                    });
                } else if (stats.isFile()) {
                    // Appending "/package.json" resolved to a file, so this must
                    // be a folder for a package.
                    file.stat = stats;
                    resolve(file);
                } else {
                    // The "package.json" is a dir? whoa!
                    resolve(new Error('Not a valid package location ' + fileOrDir));
                }
            });
        });
    }

    static loadAll (from, owner) {
        var me = this,
            paths = from,
            result = [],
            bad = function (path, error) {
                var pkg = new Package();

                if (!path.endsWith(me.jsonName)) {
                    path = xfs.join(me.jsonName);
                }

                pkg.setSourceFile(path);
                pkg.error = error;

                result.push(pkg);

                return pkg;
            };

        if (typeof from === 'string') {
            paths = from.split(',');
        }

        return new Promise(function (resolve) {
            var promises = [];

            paths.forEach(function (path) {
                if (owner) {
                    path = owner.resolve(path);
                }

                promises.push(me.grok(path).then(function (files) {
                    if (files instanceof Error) {
                        return bad(path, files);
                    }

                    if (files && files.$isFile) {
                        let index = result.length;
                        result.push(files);

                        return Package.load(files.path, owner).then(function (pkg) {
                            result[index] = pkg;
                        })
                    }

                    // It's nothing or a File[]
                    if (!files || !files.length) {
                        return;
                    }

                    let morePromises = [];

                    files.forEach(function (file) {
                        let index = result.length;
                        result.push(file);

                        morePromises.push(Package.load(file.path, owner).then(function (pkg) {
                            result[index] = pkg;
                        }));
                    });

                    return Promise.all(morePromises);
                }));
            });

            Promise.all(promises).then(function () {
                result.sort((lhs, rhs) => {
                    var a = lhs.getName(),
                        b = rhs.getName();

                    return Strings.compareNoCase(a, b);
                });

                resolve(result);
            });
        });
    }

    getTargetUrl (profile) {
        var url = super.getTargetUrl();
        if (!url) {
            url = this.getGeneratedSubjectUrl(profile);
        }
        return url;
    }
    
    getTargetPath () {
        // Working around call from CodeBase.getTargetUrl - packages don't have 
        // an implicit target to load, so it makes no sense to calculate a relative path here
        return '';
    }
}

module.exports = Package;
