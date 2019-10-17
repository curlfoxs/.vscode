'use strict';

var Base = require('../Base');
var urlParse = require('url').parse;
var os = require('os');
var Buffer = require('buffer').Buffer;
var Cookies = require('cookies');
var UserAgent = require('orion-core/lib/model/UserAgent.js');
var Util = require('orion-core/lib/Util');

class Responder extends Base {

    ctor () {
        var me = this,
            responders = me.routes;

        if (me.readRequestBody !== false) {
            me.readRequestBody = true;
        }

        if (me.cacheBust !== false) {
            me.cacheBust = true;
        }

        me.routes = {};
        if (responders) {
            me.register(responders);
        }
        if (me.init) {
            me.init();
        }
    }

    _getPathParts (path) {
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        return path.split('/');
    }

    handleRequest(req, res) {
        var me = this,
            url = urlParse(req.url, true),
            urlPath = me._getPathParts(url.pathname),
            method = req.method.toLowerCase(),
            context = {
                request: req,
                response: res,
                url: url,
                method: method,
                path: urlPath,
                code: 200,
                headers: {}
            };

        req.responderContext = context;
        res.responderContext = context;
        me.dispatch(context);
    }

    dispatch (context) {
        var me = this,
            urlPath = context.path,
            request = context.request,
            method = request.method,
            result, response,
            data, handler;

        function setErrorState (err) {
            data = (err.stack || err).toString();
            context.code = 500;
            context.headers['Content-Type'] = 'text/plain';
            console.error(data);
        }

        function complete (result) {
            try {
                if (result != null && typeof result != 'string') {
                    data = JSON.stringify(result);
                    context.headers['Content-Type'] = 'application/json';
                } else if (result) {
                    data = result;
                }
            } catch (err) {
                setErrorState(err);
            } finally {
                response = context.response;
                if (data) {
                    context.headers['content-length'] = Buffer.byteLength(data).toString();
                }
                response.writeHead(context.code || response.statusCode || 200, context.headers);
                if (data) {
                    response.write(data, function(){
                        response.end();
                    });
                } else {
                    response.end();
                }
            }
        }

        function execute () {
            handler = me[method] || me['get'];
            if (handler) {
                result = handler.call(me, context);
                if (!context.done) {
                    if (result) {
                        if (typeof result === 'function') {
                            try {
                                complete(result());
                            } catch (err) {
                                setErrorState(err);
                                complete()
                            }
                        }
                        else if (typeof result.then === 'function') {
                            result.then(function(res) {
                                complete(res);
                            }).catch (function(err) {
                                setErrorState(err);
                                complete();
                            });
                        }
                        else {
                            complete(result);
                        }
                    } else {
                        complete();
                    }
                }
            }
        }

        // detect if we need to dispatch to a sub responder
        if (urlPath.length) {
            var target = urlPath.shift(),
                subResponder = me.getSubResponder(target);
            if (subResponder) {
                return subResponder.dispatch(context)
            } else {
                urlPath.unshift(target);
            }
        }

        if (me.cacheBust) {
            Object.assign(context.headers, {
                'cache-control': 'no-cache, no-store, must-revalidate',
                'pragma': 'no-cache',
                'expires': '-1'
            });
        }

        // if no sub responder is found, we will process the request
        if (me.readRequestBody) {
            var content = '',
                req = context.request;
            req.on('data', function(chunk){
                content += chunk.toString();
            });

            req.on('end', function(){
                context.content = content;
                execute();
            });
        } else {
            execute();
        }
    }

    getSubResponder (name) {
        var me = this,
            responder;
        if (name != null) { // can be empty string for root path
            if (me[name] && me[name].isResponder) {
                return me[name];
            }
            else if (me.routes[name]) {
                responder = me.routes[name];
                if (responder.isResponder) {
                    return responder;
                }
                return responder.call(this);
            }
        }
    }

    /**
     * @param name
     * @param responder
     */
    register (name, responder) {
        var me = this,
            path, target, next, nextName;

        if (typeof name == 'object') {
            for (var key in name) {
                me.register(key, name[key]);
            }
            return;
        }

        path = me._getPathParts(name);
        target = me;

        while (path.length > 2 && (nextName = path.shift())) {
            next = target.getSubResponder(nextName);
            if (!next) {
                path.unshift(nextName);
                break;
            }
            target = next;
        }

        if (responder) {
            if (!responder.isResponder) {
                responder = new Responder(responder);
            }
        }

        while (path.length > 2) {
            nextName = path.pop();
            var curr = responder,
                cfg = {
                    routes: {}
                };
            cfg.routes[nextName] = curr;
            responder = new Responder(cfg);
        }

        var current = target.routes[path[0]];
        if (current) {
            current.register(responder.routes);
            responder.routes = current.routes;
        }
        target.routes[path[0]] = responder;
    }

    getRequestAddress(request) {
        var address = request.connection.remoteAddress;

        if (address.startsWith('::ffff:')) {
            // IPv4 address mapped into IPv6 space - strip prefix
            address = address.substr(7);
        }
        return address;
    }

    /**
     * Returns true if the IP address matches one of this local machine's addresses and
     * the local OS matches the OS from the request userAgent
     * @param {http.IncomingMessage} request
     */
    isLocalRequest(request) {
        return UserAgent.fromRequest(request).local;
    }

    getCookies (ctx) {
        return new Cookies(ctx.request, ctx.response);
    }
}

Responder.prototype.isResponder = true;

module.exports = Responder;
