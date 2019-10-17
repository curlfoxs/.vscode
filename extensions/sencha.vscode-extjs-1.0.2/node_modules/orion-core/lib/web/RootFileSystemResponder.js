'use strict';

var RootResponder = require('./RootResponder');
var finalhandler = require('finalhandler');

class RootFileSystemResponder extends RootResponder {

    get (ctx) {
        ctx.done = true;
        var me = this,
            request = ctx.request,
            response = ctx.response;

        me.getInterceptor(ctx.url.path, response);
        me.workspaceServeLib(request, response, finalhandler(request, response));
    }
}

module.exports = RootFileSystemResponder;