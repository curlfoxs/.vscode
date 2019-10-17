"use strict";

var Entity = require('./Entity');
var xfs = require('orion-core/lib/xfs');

/**
 * This class manages a Workspace definition.
 */
class WorkspaceMember extends Entity {
    setOwner (owner) {
        super.setOwner(owner);

        if (owner.isWorkspace) {
            this.setWorkspace(owner);
        } else if (owner.workspace) {
            this.setWorkspace(owner.workspace);
        }
    }

    getWorkspaceRelativePath () {
        var path = this.dir,
            workspace = this.workspace;

        if (path && workspace) {
            path = xfs.normalize(path.substring(workspace.dir.length));
            if (!path.startsWith('/')) {
                path = '/' + path;
            }
            if (!path.endsWith('/')) {
                path += '/';
            }
        }

        return path;
    }

    setWorkspace (workspace) {
        this.workspace = workspace;
    }

    resolveVariables (path) {
        var workspace = this.workspace;

        var ret = super.resolveVariables(path);

        if (workspace) {
            ret = ret.split('${workspace.dir}').join(workspace.dir);
        }

        return ret;
    }
}

module.exports = WorkspaceMember;
