'use strict';

var Strings = {
    compare (lhs, rhs) {
        var a = (lhs || ''),
            b = (rhs || '');

        if (a === b) {
            return 0;
        }

        return (a < b) ? -1 : 1;
    },

    compareNoCase (lhs, rhs) {
        return Strings.compare((lhs || '').toLocaleLowerCase(),
                               (rhs || '').toLocaleLowerCase());
    }
};

module.exports = Strings;
