'use strict';

var RootResponder = require('./RootResponder');

class RootProxyResponder extends RootResponder {

    ctor () {
        var me = this,
            proxy;
        me.proxyTarget = me.scenario.getProxyUrl();
        me.proxy = proxy = me.server.getProxy(me.proxyTarget);
        proxy.on('proxyRes', function(proxyRes, req, res){
            var origReq = proxyRes.req;
            if (!res._interceptor) {
                var interceptor = me.getInterceptor(origReq.path, res);
                if (interceptor) {
                    res._interceptor = interceptor;
                }
            }
        });
    }

    get (ctx) {
        ctx.done = true;
        var me = this,
            request = ctx.request,
            response = ctx.response,
            cookie = request.headers.cookie;

        request.headers['Accept-Encoding'] = 'deflate';

        if (cookie) {
            // google feature detects gzip support and sets a cookie that causes
            // the server to respond with gzip, which causes the proxy request to fail
            // because of an unsupported encoding type
            request.headers.cookie = cookie && cookie.replace("GZ=Z=1;", "");
        }

        request.$$response = response;
        response.$$request = request;
        me.proxy.web(request, response, {
            target: me.proxyTarget
        });
    }
}

module.exports = RootProxyResponder;
