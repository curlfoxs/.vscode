"use strict";

var Base = require('../Base');
var Project = require('./test/Project');

var xfs = require('../xfs');

/**
 * This class implements a basic data record. Many (but not all) records have associated
 * JSON data files from which they are loaded. This class also provides the basic loader
 * for this.
 */
class Testable extends Base {
    loadTests () {
        var me = this,
            path = me.getTestProjectPath();

        if (!path || !xfs.isFile(path)) {
            return Promise.resolve(null);
        }

        return Project.load(path, me).then(function (project) {
            me.tests = project;
            project.owner = me;
            return project;
        });
    }
}

module.exports = Testable;
