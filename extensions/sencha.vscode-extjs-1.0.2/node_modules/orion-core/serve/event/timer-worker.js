// This file is intended to be used as the web worker counterpart for ST.defer et.al.
// see comments in Timer.js for more details.
var ids = {};

onmessage = function(e) {
    var message = e.data,
        type = message.type,
        delay = message.delay,
        id = message.id;

    switch (type) {
        case 'setTimeout':
            ids[id] = setTimeout(function() {
                postMessage({
                    type: 'setTimeout',
                    id: id
                });
                delete ids[id];
            }, delay);
            break;
        case 'setInterval':
            ids[id] = setInterval(function() {
                postMessage({
                    type: 'setInterval',
                    id: id
                });
            }, delay);
            break;
        case 'clearTimeout':
            clearTimeout(ids[id]);
            delete ids[id];
            break;
        case 'clearInterval':
            clearInterval(ids[id]);
            delete ids[id];
            break;
        case 'init':
            break;
    }
};
