(function() {

    var maxRetries = 3,
        retryCount = 0,
        terminated = false,
        sessionId = +new Date(),
        backgroundRetryTimer, hideAlertTimer, alert;

    function ajax(options) {
        var url = options.url,
            data = options.data || null,
            success = options.success,
            failure = options.failure,
            scope = options.scope || this,
            params = options.params,
            queryParams = [],
            method, queryParamStr, xhr, sep;

        if (typeof data === "function") {
            data = data();
        }

        if (data && typeof data !== 'string') {
            data = JSON.stringify(data);
        }

        method = options.method || (data? 'POST' : 'GET');

        if (params) {
            for (var name in params) {
                if (params[name] != null) {
                    queryParams.push(name + "=" + encodeURIComponent(params[name]));
                }
            }

            queryParamStr = queryParams.join('&');

            if (queryParamStr !== '') {
                sep = url.indexOf('?') > -1 ? '&' : '?';
                url = url + sep + queryParamStr;
            }
        }

        if (typeof XMLHttpRequest !== 'undefined') {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }

        xhr.open(method, url);

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (success) {
                        success.call(scope, options, xhr);
                    }
                } else {
                    if (failure) {
                        failure.call(scope, options, xhr);
                    }
                }
            }
        };

        xhr.send(data);

        return xhr;
    }

    function redirect(url) {
        location.href = url;
        terminated = true;
    }

    function hideAlert() {
        retryCount = 0;
        clearTimeout(backgroundRetryTimer);
        if (alert) {
            alert.destroy();
            alert = null;
        }
    }

    function showAlert() {
        if (!alert) {
            alert = ST.alert({
                title: 'Lost Connection',
                message: 'Lost connection with Sencha Studio',
                buttons: [{
                    text: 'Retry',
                    handler: function() {
                        hideAlert();
                        poll();
                    }
                }]
            });
        }
    }

    function success(options, xhr) {
        var text = xhr.responseText,
            message = text && JSON.parse(text),
            url, port, page;

        hideAlert();

        if (!terminated) {
            if (message) {
                url = message.url;
                port = message.port;
                page = message.page;

                if (!url) {
                    url = location.protocol + "//" + location.hostname;

                    if (port) {
                        url += ':' + port;
                    }

                    if (page) {
                        url += '/' + page;
                    }
                }
                redirect(url);
            } else {
                poll();
            }
        }
    }

    function failure(options, xhr) {
        clearTimeout(hideAlertTimer);

        if (++retryCount < maxRetries) {
            setTimeout(poll, 500 * retryCount);
        } else {
            showAlert();
            backgroundRetryTimer = setTimeout(poll, 20000);
        }
    }

    function poll () {
        ajax({
            url: '/~orion/poll',
            params: {
                sessionId: sessionId
            },
            success: success,
            failure: failure
        });

        if (alert) {
            hideAlertTimer = setTimeout(hideAlert, 1000);
        }
    }

    poll();

})();
