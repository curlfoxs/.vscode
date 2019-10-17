"use strict";

var httpProxy = require('http-proxy');
var http = require('http');
var RootProxyResponder = require('./RootProxyResponder');
var RootFileSystemResponder = require('./RootFileSystemResponder');
var Server = require('./Server');

class ProxyServer extends Server {
    static get meta () {
        return {
            prototype: {
                description: 'Proxy Server'
            }
        };
    }

    getProxy () {
        var me = this;
        if (!me.proxy) {
            me.proxy = httpProxy.createProxyServer({
                // hostRewrite: true,
                // autoRewrite: true,
                // protocolRewrite: true,

                // This fellow is bad for developers who will rely on self-signed certs:
                //
                //      You can activate the validation of a secure SSL certificate to
                //      the target connection (avoid self signed certs)...
                //
                // Good news is that it does not seem to be needed to proxy to HTTPS
                // servers (like https://www.google.com).
                //
                secure: false,

                changeOrigin: true
            });

            me.proxy.on('proxyReq', me._onProxyReq.bind(me));
            //me.proxy.on('proxyRes', me._onProxyRes.bind(me));
            me.proxy.on('error', me._onProxyError.bind(me));
        }

        return me.proxy;
    }

    getRootResponder () {
        var me = this,
            root = me._root;

        if (!root) {
            root = me.noProxy
                ? new RootFileSystemResponder(me)
                : new RootProxyResponder(me);
            me._root = root;
        }
        return root;
    }

    _onProxyReq (proxyReq, req, res, options) {
        var me = this,
            cookie = req.headers.cookie;

        proxyReq.setHeader('Accept-Encoding', 'deflate');

        if (cookie) {
            // google feature detects gzip support and sets a cookie that causes
            // the server to respond with gzip, which causes the proxy request to fail
            // because of an unsupported encoding type
            req.headers.cookie = cookie && cookie.replace("GZ=Z=1;", "");
        }
    }

    _onProxyError (err, req, res) {
        var me = this;

        if (err.code !== 'ECONNRESET') {
            me.error((err.stack || err).toString());
            me.fire({
                type: 'proxyerror',
                error: err
            });
        } else {
            if (!req.complete) {
                // TODO determine if the response is still hanging
            }
        }
    }
}

module.exports = ProxyServer;
