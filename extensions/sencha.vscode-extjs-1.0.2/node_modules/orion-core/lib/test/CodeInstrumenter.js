'use strict';

var os = require('os');
var istanbul = require('istanbul');

class CodeInstrumenter {

    constructor (cfg) {
        var me = this;
        Object.assign(me, cfg);
        me.size = me.size || os.cpus().length;
        me.workers = [];
        me.listeners = {};
        me.instrumenter = new istanbul.Instrumenter({
            embedSource: true
        });
    }

     getFilters () {
        var me = this,
            scenario = me.scenario,
            filters = me.filters,
            coverageFilters, project;

        if (!filters) {
            filters = [];
            if (scenario) {
                coverageFilters = scenario.coverageFilters || scenario.data.coverageFilters;
                if (coverageFilters) {
                    coverageFilters.forEach(function(filter){
                        if (!filter.disabled) {
                            filters.push(new RegExp(filter.path));
                        }
                    });
                }
                project = scenario.project;
                if (project) {
                    coverageFilters = project.coverageFilters || project.data.coverageFilters;
                    if (coverageFilters) {
                        coverageFilters.forEach(function(filter){
                            if (!filter.disabled) {
                                filters.push(new RegExp(filter.path));
                            }
                        });
                    }
                }
            }
            me.filters = filters;
        }
        return filters;
    }

    instrument (data, path) {
        var me = this,
            filters = me.getFilters(),
            len = filters.length;

        if (len) {
            for (var i = 0; i < len; i++) {
                if (filters[i].test(path)) {
                    return data;
                }
            }
        }
        return me.instrumenter.instrumentSync(data, path);
    }

}

module.exports = CodeInstrumenter;