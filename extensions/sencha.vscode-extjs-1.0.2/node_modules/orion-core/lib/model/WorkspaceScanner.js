'use strict';

var File = require('orion-core/lib/fs/File');

class WorkspaceScanner {

    static get appCfgName () { return '.sencha/app/sencha.cfg'; }
    static get packageCfgName () { return '.sencha/package/sencha.cfg'; }
    static get frameworkCfgName () { return 'cmd/sencha.cfg'; }

    scan (directory) {
        var me = this,
            dir = new File(directory);
        return new Promise(function(resolve, reject){
            dir.getFiles().then(function(files){
                dir.items = files;
                me._detectSenchaCfg(dir, dir).then(function(workspaceCfg){
                    resolve(workspaceCfg)
                }, reject);
            }, reject);
        });
    }

    _detectSenchaCfg (workspaceDir, dir, cfg) {
        cfg = cfg || {
            packages: {
                dir: '${workspace.dir}/packages/local,${workspace.dir}/packages',
                extract: '${workspace.dir}/packages/remote'
            },
            frameworks: {}
        };

        var me = this,
            promises = [],
            appCfg = dir.join(WorkspaceScanner.appCfgName),
            pkgCfg = dir.join(WorkspaceScanner.packageCfgName),
            fwCfg = dir.join(WorkspaceScanner.frameworkCfgName);

        return new Promise(function(resolve, reject){

            if (appCfg.existsSync()) {
                if (dir != workspaceDir) {
                    cfg.apps = cfg.apps || [];
                    cfg.apps.push(workspaceDir.relativeTo(dir));
                }
            }
            else if (fwCfg.existsSync()) {
                cfg.frameworks[dir.name] = workspaceDir.relativeTo(dir).getPath();
            }

            if (dir.items && dir.items.length) {
                dir.items.forEach(function(file){
                    if (file.stat.isDirectory()) {
                        promises.push(me._detectSenchaCfg(workspaceDir, file, cfg));
                    }
                });
            }

            Promise.all(promises).then(function(){
                resolve(cfg);
            }, reject);
        });
    }

}

module.exports = WorkspaceScanner;