/**
 * @class ST.event.Event
 * @private
 */
ST.event.Event = ST.define({
    normalizedType: {
        mousewheel: 'wheel'
    },

    constructor: function(event, targets, time) {
        var me = this,
            self = me.self,
            type = event.type,
            target = event.target,
            i, n, origin, pointerType, t, touch, xy;

        time = time || +(event.timeStamp || new Date());

        ST.apply(me, {
            browserEvent: event,
            target: target,
            targets: [],
            type: me.normalizedType[type] || self.MSToPointer[type] || type,
            button: event.button,
            buttons: event.buttons,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey, // Mac "command" key
            altKey: event.altKey,
            charCode: event.charCode,
            keyCode: event.keyCode,
            time: time,
            pageX: event.pageX,
            pageY: event.pageY,
            detail: event.detail,
            pointerId: event.pointerId,
            isPrimary: event.isPrimary
        });

        if (self.mouseEvents[type] || self.clickEvents[type]) {
            pointerType = 'mouse';
        } else if (self.pointerEvents[type] || self.msPointerEvents[type]) {
            pointerType = self.pointerTypes[event.pointerType];
        } else if (self.touchEvents[type]) {
            pointerType = 'touch';
        }

        if (pointerType) {
            me.pointerType = pointerType;
        }

        if (type === 'scroll') {
            me.scrollPosition = ST.fly(target).getScroll();
        }

        if (me.isMouse() || me.isPointer()) {
            xy = me.getXY();
        }
        else if (me.isTouch()) {
            // TODO: ORION-42 - support multi-touch recording
            touch = me.browserEvent.changedTouches[0];

            xy = [
                Math.round(touch.pageX),
                Math.round(touch.pageY)
            ];
        }

        // Locators produce targets[] as pairs of [el, locator] so convert
        // them to event subsets.
        for (i = 0, n = targets.length; i < n; ++i) {
            me.targets[i] = t = {
                target: targets[i][1]  // the locator
            };

            if (xy) {
                origin = ST.fly(targets[i][0]).getXY(); // origin of the target el

                t.x = xy[0] - origin[0];
                t.y = xy[1] - origin[1];
            }

            if (me.isKey() && me.caret == null) {
                me.caret = ST.fly(targets[i][0]).getCaret(true);
            }
        }
    },

    getXY: function() {
        var me = this,
            xy = me.xy;

        if (!xy) {
            xy = me.xy = [me.pageX, me.pageY];
            //<feature legacyBrowser>
            var x = xy[0],
                browserEvent, doc, docEl, body;

            // pageX/pageY not available (undefined, not null), use clientX/clientY instead
            if (!x && x !== 0) {
                browserEvent = me.browserEvent;
                doc = document;
                docEl = doc.documentElement;
                body = doc.body;
                xy[0] = browserEvent.clientX +
                    (docEl && docEl.scrollLeft || body && body.scrollLeft || 0) -
                    (docEl && docEl.clientLeft || body && body.clientLeft || 0);
                xy[1] = browserEvent.clientY +
                    (docEl && docEl.scrollTop  || body && body.scrollTop  || 0) -
                    (docEl && docEl.clientTop  || body && body.clientTop  || 0);
            }
            //</feature>
        }

        return xy;
    },

    getKey: function(){
        var me = this,
            keyCode = me.keyCode,
            charCode = me.charCode,
            KeyMap = ST.KeyMap,
            key;

        if (me.type === 'keypress') {
            // keypress events are the only events that have a charCode
            if (charCode === undefined) {
                // IE9 and earlier have the character code in the keyCode property
                charCode = keyCode;
            } if (charCode === 0) {
                // firefox fires keypress events for function keys with charCode = 0
                // If this is the case we want the key name (F1, F2 etc)
                key = KeyMap.keys[keyCode];
            } else {
                key = KeyMap.specialKeys[charCode] || String.fromCharCode(charCode);
            }
        } else {
            if (me.shiftKey) {
                key = KeyMap.shiftKeys[keyCode];
            }

            if (!key) {
                key = KeyMap.keys[keyCode];
            }
        }

        return key || null;
    },

    getWheelDeltas: function() {
        var deltas = { x: 0 },
            browserEvent = this.browserEvent;

        if (this.browserEvent.type === 'wheel') {
            // Current FireFox (technically IE9+ if we use addEventListener but
            // checking document.onwheel does not detect this)
            deltas.x = browserEvent.deltaX;
            deltas.y = browserEvent.deltaY;
        } else if (typeof browserEvent.wheelDeltaX === 'number') {
            // new WebKit has both X & Y
            deltas.x = -1/40 * browserEvent.wheelDeltaX;
            deltas.y = -1/40 * browserEvent.wheelDeltaY;
        } else if (browserEvent.wheelDelta) {
            // old WebKit and IE
            deltas.y = -1/40 * browserEvent.wheelDelta;
        } else if (browserEvent.detail) {
            // Old Gecko
            deltas.y = browserEvent.detail;
        }

        return deltas;
    },

    toJSON: function() {
        var me = this,
            self = me.self,
            type = me.type,
            browserEvent = me.browserEvent,
            targets = me.targets,
            data = {
                type: type,
                targets: targets
            },
            isPointer = me.isPointer(),
            scrollPosition = me.scrollPosition,
            button = me.button,
            buttons = me.buttons,
            altKey = me.altKey,
            ctrlKey = me.ctrlKey,
            shiftKey = me.shiftKey,
            metaKey = me.metaKey,
            KeyMap = ST.KeyMap,
            keyCode = me.keyCode,
            caret = me.caret,
            i, n, origin, reverseKeyCode, xy, touch, wheelDeltas, key;

        if (isPointer || me.isMouse()) {
            // only serialize non-zero values for button and buttons since 0
            // is the default playback value for both properties
            if (button) {
                data.button = button;
            }

            if (buttons && (!self.downEvents[type] || (buttons !== self.buttonToButtons[button]))) {
                // When the mouse/pointer is "down", only serialize the buttons property
                // if there are multiple buttons pressed.
                data.buttons = buttons;
            }

            if (isPointer) {
                data.identifier = me.pointerId;
                data.pointerType = me.pointerType;
                // TODO: multi-touch
                //data.isPrimary = me.isPrimary
            }
        }
        else if (me.isTouch()) {
            // TODO: ORION-42 - support multi-touch recording
            touch = browserEvent.changedTouches[0];

            data.identifier = touch.identifier;
        }

        ST.apply(data, targets[0]); // targets = [{ target: '@foo', x: 10, y: 10 }, ...]

        if (self.detailEvents[type]) {
            data.detail = me.detail;
        }

        // only encode true values for altKey/shiftKey/ctrlKey/metaKey since they default to false
        if (altKey) {
            data.altKey = altKey;
        }

        if (ctrlKey) {
            data.ctrlKey = ctrlKey;
        }

        if (shiftKey) {
            data.shiftKey = shiftKey;
        }

        if (metaKey) {
            data.metaKey = metaKey;
        }

        if (me.isKey()) {
            key = me.getKey();

            if (caret != null) {
                data.caret = caret;
            }

            if (key) {
                data.key = key;
                // The reverse key map (used for playback) can only contain one keyCode
                // per character.  If we detect that playback will default to a different
                // keyCode than the one we have here, lets add the keyCode to the serialized
                // event as well so that the user has the option to preserve that info
                // during playback.  (Only needed for keydown/up since keypress does not
                // have a key code)
                if (type !== 'keypress') {
                    if (shiftKey) {
                        reverseKeyCode = KeyMap.reverseShiftKeys[key];
                    }

                    if (!reverseKeyCode) {
                        reverseKeyCode = KeyMap.reverseKeys[key];
                    }

                    if (reverseKeyCode !== keyCode) {
                        data.keyCode = keyCode;
                    }
                }
            } else {
                data.keyCode = keyCode;
            }
        }

        if (type === 'scroll') {
            data.pos = [scrollPosition.x, scrollPosition.y];
        }

        if (type === 'wheel') {
            wheelDeltas = me.getWheelDeltas();
            data.deltaX = wheelDeltas.x;
            data.deltaY = wheelDeltas.y;
        }

        return data;
    },

    isMouse: function() {
        var self = this.self,
            type = this.type;

        return !!(self.mouseEvents[type] || self.clickEvents[type] || (type === 'wheel'));
    },

    isPointer: function() {
        return !!(this.self.pointerEvents[this.type] || this.self.msPointerEvents[this.type]);
    },

    isTouch: function() {
        return !!this.self.touchEvents[this.type];
    },

    isKey: function() {
        return !!this.self.keyEvents[this.type];
    },

    statics: {
        mouseEvents: {
            mousedown: 1,
            mousemove: 1,
            mouseup: 1,
            mouseover: 1,
            mouseout: 1,
            mouseenter: 1,
            mouseleave: 1
        },

        clickEvents: {
            click: 1,
            dblclick: 1
        },

        pointerEvents: {
            pointerdown: 1,
            pointermove: 1,
            pointerup: 1,
            pointercancel: 1,
            pointerover: 1,
            pointerout: 1,
            pointerenter: 1,
            pointerleave: 1
        },

        msPointerEvents: {
            MSPointerDown: 1,
            MSPointerMove: 1,
            MSPointerUp: 1,
            MSPointerCancel: 1,
            MSPointerOver: 1,
            MSPointerOut: 1,
            MSPointerEnter: 1,
            MSPointerLeave: 1
        },

        touchEvents: {
            touchstart: 1,
            touchmove: 1,
            touchend: 1,
            touchcancel: 1
        },

        keyEvents: {
            keydown: 1,
            keyup: 1,
            keypress: 1
        },

        focusEvents: {
            focus: 1,
            blur: 1
        },

        movementEvents: {
            mousemove: 1,
            touchmove: 1,
            pointermove: 1,
            MSPointerMove: 1
        },

        pointerToMS: {
            pointerdown: 'MSPointerDown',
            pointermove: 'MSPointerMove',
            pointerup: 'MSPointerUp',
            pointercancel: 'MSPointerCancel',
            pointerover: 'MSPointerOver',
            pointerout: 'MSPointerOut',
            pointerenter: 'MSPointerEnter',
            pointerleave: 'MSPointerLeave'
        },

        MSToPointer: {
            MSPointerDown: 'pointerdown',
            MSPointerMove: 'pointermove',
            MSPointerUp: 'pointerup',
            MSPointerCancel: 'pointercancel',
            MSPointerOver: 'pointerover',
            MSPointerOut: 'pointerout',
            MSPointerEnter: 'pointerenter',
            MSPointerLeave: 'pointerleave'
        },

        mouseToPointer: {
            mousedown: 'pointerdown',
            mousemove: 'pointermove',
            mouseup: 'pointerup',
            mouseover: 'pointerover',
            mouseout: 'pointerout',
            mouseenter: 'pointerenter',
            mouseleave: 'pointerleave'
        },

        pointerToMouse: {
            pointerdown: 'mousedown',
            pointermove: 'mousemove',
            pointerup: 'mouseup',
            pointerover: 'mouseover',
            pointerout: 'mouseout',
            pointerenter: 'mouseenter',
            pointerleave: 'mouseleave'
        },

        touchToPointer: {
            touchstart: 'pointerdown',
            touchmove: 'pointermove',
            touchend: 'pointerup',
            touchcancel: 'pointercancel'
        },

        pointerToTouch: {
            pointerdown: 'touchstart',
            pointermove: 'touchmove',
            pointerup: 'touchend',
            pointercancel: 'touchcancel'
        },

        touchToMouse: {
            touchstart: 'mousedown',
            touchmove: 'mousemove',
            touchend: 'mouseup'
        },

        mouseToTouch: {
            mousedown: 'touchstart',
            mousemove: 'touchmove',
            mouseup: 'touchend'
        },

        // msPointerTypes in IE10 are numbers, in the w3c spec they are strings.
        // this map allows us to normalize the pointerType for an event
        // http://www.w3.org/TR/pointerevents/#widl-PointerEvent-pointerType
        // http://msdn.microsoft.com/en-us/library/ie/hh772359(v=vs.85).aspx
        pointerTypes: {
            2: 'touch',
            3: 'pen',
            4: 'mouse',
            touch: 'touch',
            pen: 'pen',
            mouse: 'mouse'
        },

        msPointerTypes: {
            touch: 2,
            pen: 3,
            mouse: 4
        },

        downEvents: {
            mousedown: 1,
            pointerdown: 1,
            MSPointerDown: 1
        },

        // events for which the "detail" property can be non-zero
        // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/detail
        detailEvents: {
            mousedown: 1,
            mouseup: 1,
            click: 1,
            dblclick: 1
        },

        buttonToButtons: {
            0: 1,
            1: 4,
            2: 2
        },

        buttonsToButton: {
            1: 0,
            4: 1,
            2: 2
        }
    }
});
