"use strict";

var fs = require('mz/fs');
var path = require('path');
var sanitize = require('sanitize-filename');

class JsonReporter {
    
    constructor(dir) {
        this.groups = [ ];
        this.dir = dir;
    }
    
    newGroup(os, name, version) {
        var group = new OutputGroup(this, os, name, version);
        this.groups.push(group);
        return group;
    }
    
    *flush() {
        var flushAll = [ ];
        var me = this;
        me.groups.forEach(function(group) {
            flushAll.push(function*() {
                yield group.flush();
            });
        });
        yield flushAll;
        me.groups = [ ];
    }
    
}

class OutputGroup {
    
    constructor(reporter, os, name, version) {
        os = os || 'any';
        name = name || 'any';
        version = version || 'any';
        
        this.reporter = reporter;
        this.os = os;
        this.name = name;
        this.version = version;
        
        this.result = {
            name: os + '@' + name + '@' + version,
            status: 'passed',
            children: [ ]
        };
    }
    
    newOutput() {
        return new ReportOutput(this);
    }
    
    *flush() {
        var file = path.join(this.reporter.dir, this.fileName);
        yield fs.writeFile(file, JSON.stringify(this.result, null, 4));
    }
    
    get fileName() {
        return sanitize(this.os + '-' + this.name + '-' + this.version + '.json');
    }
    
}

class ReportOutput {
    
    constructor(group) {
        this.group = group;
        this.results = [ ];
        this.breadcrumb = [ ];
        
        this.passed = true;
    }
    
    flush() {
        this.group.reporter.flush();
    }
    
    reportMessage(message) {
        var type = message.type;
        var name = message.name;
        var error = message.error;
        var details = message.details;
        
        if ('testRunStarted' == type) {
            
        } else if ('testRunFinished' == type) {
            this.testRunFinished();
        } else if ('testSuiteStarted' == type) {
            this.testSuiteStarted(name);
        } else if ('testSuiteFinished' == type) {
            this.testSuiteFinished(name);
        } else if ('testStarted' == type) {
            this.testStarted(name);
        } else if ('testFinished' == type) {
            this.testFinished(name);
        } else if ('testFailed' == type) {
            this.testFailed(name, error, details);
        }
    }
    
    testRunFinished() {
        var result = this.group.result;
        
        if (!this.passed) {
            result.status = 'failed';
        }
        
        result.children = result.children.concat(this.results);
    }
    
    testSuiteStarted(name) {
        var breadcrumb = this.breadcrumb;
        var parent = breadcrumb[breadcrumb.length - 1];
        var suite = {
            name: name,
            status: 'passed',
            children: [ ]
        }
        
        if (parent) {
            parent.children.push(suite);
        }
        
        if (!breadcrumb.length) {
            this.results.push(suite);
        }
        
        breadcrumb.push(suite);
    }
    
    testSuiteFinished(name) {
        this.breadcrumb.pop();
    }
    
    testStarted(name) {
        var breadcrumb = this.breadcrumb;
        var parent = breadcrumb[breadcrumb.length - 1];
        
        var test = {
            name: name,
            status: 'passed'
        }
        
        if (parent) {
            parent.children.push(test);
        }
        
        breadcrumb.push(test);
    }
    
    testFinished(name) {
        this.breadcrumb.pop();
    }
    
    testFailed(name, message, details) {
        var breadcrumb = this.breadcrumb;
        var node = breadcrumb[breadcrumb.length - 1];
        
        node.message = message;
        node.details = details;
        
        breadcrumb.forEach(function(node) {
            node.status = 'failed';
        });
        
        this.passed = false;
    }
    
}

module.exports = JsonReporter;
