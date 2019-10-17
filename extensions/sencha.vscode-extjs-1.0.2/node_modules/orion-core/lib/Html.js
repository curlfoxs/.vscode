'use strict';

const HtmlParser = require('htmlparser2');

var Html = {
    appendChild (parent, child) {
        Html.insertBefore(parent, child, null);
    },

    insertBefore (parent, child, before) {
        var after, c, children, i, k;
        
        if (Array.isArray(child)) {
            k = child.length;
            
            if (before) {
                for (; k-- > 0; ) {
                    c = child[k];
                    Html.insertBefore(parent, c, before);
                    before = c;
                }
            } else {
                for (i = 0; i < k; ++i) {
                    Html.insertBefore(parent, child[i], null);
                }
            }

            return;
        }

        children = parent.children || (parent.children = []);
        after = before ? before.prev : children[children.length - 1];

        child.parent = parent;

        if (before) {
            before.prev = child;
            child.next = before;

            i = children.indexOf(before);
            children.splice(i, 0, child);
        } else {
            children.push(child);
        }

        if (after) {
            child.prev = after;
            after.next = child;
        }
    },

    parse (text) {
        var parser = new HtmlParser.Parser(new HtmlParser.DomHandler(function (err, dom) {
                if (!err) {
                    ret = dom;
                }
            })),
            ret;

        parser.write(text);
        parser.done();

        return ret;
    },
    
    stringify (dom) {
        return HtmlParser.DomUtils.getOuterHTML(dom);
    }
};

module.exports = Html;
