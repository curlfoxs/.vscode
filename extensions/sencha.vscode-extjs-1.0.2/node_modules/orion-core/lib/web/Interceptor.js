'use strict';

var Base = require('../Base');
var http = require('http');
var Buffer = require('buffer').Buffer;

class Interceptor extends Base {
    constructor(cfg) {
        super(cfg);
        Object.assign(this, cfg);
        var me = this,
            target = me.target;


        me._buffer = '';

        me.hook([
            'writeHead',
            'setHeader',
            'write',
            'end'
        ]);

        if (target instanceof http.ServerResponse) {
            me._targetIsResponse = true;
        }
        else if (target.isInterceptor) {
            me._targetIsInterceptor = true;
        }
    }

    hook (names) {
        var me = this,
            target = me.target;

        names.forEach(function(name) {
            if (me[name]) {
                me['__' + name] = target[name].bind(target);
                target[name] = me[name].bind(me);
            }
        });
    }

    setHeader (name, value) {
        var headers = this.headers || (this.headers = {});
        headers[name] = value;
    }

    writeHead (code, headers) {
        this.code = code;
        if (headers) {
            if (this.headers) {
                Object.assign(this.headers, headers);
            } else {
                this.headers = headers;
            }
        }
    }

    write (chunk, callback) {
        this._buffer += chunk.toString();
    }

    end (data, callback) {
        if (data && typeof data === 'function') {
            callback = data;
            data = null;
        }
        if (data) {
            this.write(data);
        }
        this.done();
    }

    applyHeaders (headers) {
        var me = this,
            value;
        if (headers) {
            Object.keys(headers).forEach(function(key){
                value = headers[key];
                me.headers[key] = value;
            });
        }
    }

    flushHeaders () {
        var me = this,
            headers = me.headers,
            value;
        Object.keys(headers).forEach(function(key){
            value = headers[key];
            me.__setHeader(key, value);
        });
    }

    done () {
        var me = this,
            target = me.target,
            data = me._buffer;

        function setErr(err) {
            data = (err.stack || err).toString();
            me.code = 500;
            me.setHeader('Content-Type', 'text/plain');
        }

        function complete(data) {
            if (me._targetIsResponse) {
                if (data) {
                    var len = Buffer.byteLength(data);
                    me.setHeader('content-length', len.toString());
                }
                me.applyHeaders(me.headers);
                me.applyHeaders(me.context && me.context.headers);
                me.flushHeaders();
                me.__writeHead(me.code || target.statusCode || 200, me.headers);
                if (data) {
                    me.__write(data, function(){
                        me.__end();
                    });
                } else {
                    me.__end();
                }
            } else {
                target.write(data);
                target.done();
            }
        }

        if (data && me.prepareData) {
            try {
                data = me.prepareData.call(me, data, target);
                if (data && typeof data.then === 'function') {
                    data.then(function(res){
                        complete(res);
                    }).catch(function(err) {
                        setErr(err);
                        complete(data);
                    });
                } else {
                    complete(data);
                }
            } catch (err) {
                setErr(err);
                complete(data);
            }
        } else {
            complete();
        }
    }
}

Interceptor.prototype.isInterceptor = true;

module.exports = Interceptor;
