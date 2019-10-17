/**
 * @class ST.Alert
 * This class manages a simple alert box that overlays and masks all other elements on
 * the page. This alert does not block the application like the standard DOM `alert()`
 * method.
 *
 * Instances of this class are typically created by calling {@link ST#alert}.
 */
ST.Alert = ST.define({
    /**
     * @cfg {Object[]} buttons
     * An array of objects containing `text` and `handler` properties that indicate,
     * respectively, the button's text and callback to invoke on button click.
     */

    /**
     * @cfg {String} message
     * The string to display inside the message box.
     */

    /**
     * @cfg {String} title
     * The string to display in the title bar of the message box.
     */

    constructor: function(cfg) {
        var me = this,
            div = function() {
                return document.createElement('div');
            },
            maskWrap = me.maskWrap = div(),
            maskCell = div(),
            mask = div(),
            alert = div(),
            alertBody = div(),
            buttons = cfg.buttons,
            alertTitle, alertFooter, i, len, button, btn;

        maskWrap.className = 'orion-mask-wrap orion-border-box';
        maskCell.className = 'orion-mask-cell';
        mask.className = 'orion-mask';
        alert.className = 'orion-alert';

        alertBody.className = 'orion-alert-body';
        alertBody.innerHTML = cfg.message;

        if (cfg.title) {
            alertTitle = div();
            alertTitle.className = 'orion-alert-title';
            alertTitle.innerHTML = cfg.title;
            alert.appendChild(alertTitle);
        }

        alert.appendChild(alertBody);

        if (buttons) {
            alertFooter = div();
            alertFooter.className = 'orion-alert-footer';

            for (i = 0, len = buttons.length; i < len; i++) {
                button = buttons[i];
                btn = div();
                btn.className = 'orion-alert-button orion-noselect';
                btn.innerHTML = button.text;
                button.listener = ST.Element.on(btn, 'click', button.handler);
                alertFooter.appendChild(btn);
            }

            alert.appendChild(alertFooter);
        }

        //maskCell.appendChild(mask);
        maskCell.appendChild(alert);
        maskWrap.appendChild(maskCell);

        me.hide();
        me._resize();

        me.resizeHandler = ST.Element.on(window, 'resize', function() {
            me._resize();
        });

        if (document.body) {
            document.body.appendChild(maskWrap);
        } else {
            var loaded = ST.Element.on(window, 'load', function () {
                loaded.destroy();
                loaded = null;

                document.body.appendChild(maskWrap);
            });
        }
    },

    /**
     * Displays the message box main element.
     */
    show: function() {
        this.maskWrap.style.display = '';
    },

    /**
     * Hides the message box main element.
     */
    hide: function() {
        this.maskWrap.style.display = 'none';
    },

    /**
     * Removes the message box element from the DOM.
     */
    destroy: function() {
        var me = this,
            buttons = me.buttons,
            resizeHandler = me.resizeHandler,
            len = buttons ? buttons.length : 0,
            button, i;

        if (resizeHandler) {
            me.resizeHandler = null;
            resizeHandler.destroy();

            document.body.removeChild(me.maskWrap);

            for (i = 0; i < len; i++) {
                button = buttons[i];
                button.listener.destroy();
                button.listener = null;
            }
        }
    },

    _resize: function() {
        var style = this.maskWrap.style,
            win = window,
            doc = document.documentElement;

        style.height = (win.innerHeight || doc.clientHeight) + 'px';
        style.width = (win.innerWidth || doc.clientWidth) + 'px';
    }
});

/**
 * Creates and returns an `ST.Alert` passing along the specified `config` object. This
 * method calls {@link ST.Alert#show} before returning the instance.
 *
 * @param {Object} config The config object for an instance of {@link ST.Alert}.
 * @return {ST.Alert}
 * @method alert
 * @member ST
 */
ST.alert = function(config) {
    var alert = new ST.Alert(config);
    alert.show();
    return alert;
};
