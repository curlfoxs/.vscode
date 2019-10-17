'use strict';

var Responder = require('./Responder');
var urlParse = require('url').parse;
var Interceptor = require('./Interceptor');
var finalhandler = require('finalhandler');
var path = require('path');
var serveStatic = require('serve-static');

class RootResponder extends Responder {
    constructor(server) {
        var me,
            scenario = server.scenario,
            project = scenario.project,
            filesServeLib = serveStatic(path.normalize(__dirname + '/../../serve/')),
            sandboxServeLib = serveStatic(path.normalize(__dirname + '/../../sandbox/')),
            jasmineServeLib = serveStatic(path.normalize(__dirname + '/../../node_modules/jasmine-core/lib/jasmine-core/')),
            workspaceServeLib = serveStatic(project.getWorkspaceMountDir());

        super({
            server: server,
            scenario: scenario,
            project: project,
            readRequestBody: false,
            intercepts: [],
            serveLib: filesServeLib,
            workspaceServeLib: workspaceServeLib,
            routes: {
                '~orion': {
                    routes: {
                        files: {
                            get: function(ctx) {
                                ctx.done = true;
                                var request = ctx.request,
                                    response = ctx.response,
                                    prefix = '~orion/files/';
                                request.url = request.url.substr(prefix.length);
                                if(request.url.indexOf('/jasmine/jasmine.js') == 0) {
                                    request.url = 'jasmine.js';
                                    jasmineServeLib(request, response, finalhandler(request, response));
                                } else {
                                    filesServeLib(request, response, finalhandler(request, response));
                                }
                            }
                        },
                        sandbox: {
                            get: function(ctx) {
                                ctx.done = true;
                                var request = ctx.request,
                                    response = ctx.response,
                                    prefix = '~orion/sandbox/';
                                request.url = request.url.substr(prefix.length);
                                me.getInterceptor(ctx.url.path, response);
                                sandboxServeLib(request, response, finalhandler(request, response));
                            }
                        },
                        workspace: {
                            get: function(ctx) {
                                ctx.done = true;
                                var request = ctx.request,
                                    response = ctx.response,
                                    prefix = '~orion/workspace/';
                                request.url = request.url.substr(prefix.length);
                                workspaceServeLib(request, response, finalhandler(request, response));
                            }
                        }
                    }
                }
            }
        });
        
        me = this;
    }

    getInterceptor (path, response) {
        var url = urlParse(path),
            intercepts = this.intercepts,
            interceptor = null;

        for (var i = 0; i < intercepts.length; i++) {
            var intercept = intercepts[i],
                test = intercept.test;
            if (!test) {
                test = new RegExp(intercept.pattern);
                intercept.test = test;
            }
            if (test.test(url.pathname)) {
                interceptor = new Interceptor({
                    target: response,
                    prepareData: intercept.fn,
                    context: response.responderContext
                });
                break;
            }
        }

        return interceptor;
    }

    intercept (pattern, fn) {
        this.intercepts.push({
            pattern: pattern,
            fn: fn
        });
    }

    clearInterceptors() {
        this.intercepts.length = 0;
    }
}

module.exports = RootResponder;
