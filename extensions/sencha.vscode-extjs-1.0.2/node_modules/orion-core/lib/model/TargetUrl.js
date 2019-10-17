'use strict';

const Base = require('../Base');
const Url = require('url');
const startSlashRe = /^\//;
const protocolRe = /^(https?)?:?(?:\/{1,2})?([^#?]*)/i;

class TargetUrl extends Base {
    static get meta () {
        return {
            mixinId: 'targetUrl',
            prototype: {
                defaultProtocol: 'http'
            }
        };
    }

    getSubjectPath () {
        var parsed = Url.parse(this.getFullTargetUrl() || '', true);

        return Url.format({
            path: parsed.path.replace(startSlashRe, ''),
            pathname: parsed.pathname.replace(startSlashRe, ''),
            href: parsed.href,
            hash: parsed.hash,
            query: parsed.query
        });
    }

    getSubjectPage () {
        return Url.parse(this.getFullTargetUrl() || '', true).pathname;
    }

    getProxyUrl (server, port) {
        var parsed = Url.parse(this.getFullTargetUrl() || '');

        return Url.format({
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port
        });
    }

    getCalculatedTargetUrl () {
        var targetUrl = this.getTargetUrl(),
            parsed = Url.parse(targetUrl);

        if (parsed.protocol && parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            parsed.port = parsed.hostname;
            parsed.hostname = parsed.protocol;
            if (parsed.hostname.endsWith(':')) {
                parsed.hostname = parsed.hostname.substring(0, parsed.hostname.length - 1);
            }
            delete parsed.host;
            delete parsed.href;
            parsed.protocol = 'http';
        }

        return Url.format(parsed);
    }

    getFullTargetUrl(server, port) {
        var targetUrl = this.getCalculatedTargetUrl(),
            parsed = Url.parse(targetUrl);

        if (!parsed.protocol) {
            parsed.protocol = 'http';
            if (!parsed.hostname) {
                parsed.hostname = server;
                parsed.port = parsed.port || port;
            }
            else {
                parsed.port = parsed.port || port;
            }

        }
        return Url.format(parsed);
    }

}

module.exports = TargetUrl;
