/**
 * @class ST.supports
 * This singleton contains various boolean properties to describe the supported features
 * of the current browser.
 * @singleton
 */
(function() {
    var testEl = document.createElement('div'),
        name, supports, value;

    ST.supports = supports = {
        /**
         * Set to `true` if this browser supports the Pointer Events W3C specification.
         * At this time this is only supported by IE11 and Microsoft Edge.
         * @property {Boolean} PointerEvents
         * @readonly
         */
        PointerEvents: navigator.pointerEnabled,

        /**
         * Set to `true` if this browser supports the "ms" vendor prefixed version of
         * the Pointer Events W3C specification. These events are slightly different than
         * the final W3C specification.
         *
         * At this time this is only supported by IE10 and IE11.
         * @property {Boolean} MSPointerEvents
         * @readonly
         */
        MSPointerEvents: navigator.msPointerEnabled,

        /**
         * Set to `true` if this browser supports touch events ("touchstart" et.al.).
         *
         * At this time this is true for mobile devices such as iOS and Android but also
         * Chrome on other touch-screen devices.
         * @property {Boolean} TouchEvents
         * @readonly
         */
        TouchEvents: function () {
            return 'ontouchend' in testEl;
        },

        /**
         * Set to `true` if this browser supports the standard `wheel` event. When this
         * is `false`, code generally falls back to the older "nousewheel" event.
         * @property {Boolean} Wheel
         * @readonly
         */
        Wheel: function() {
            return 'onwheel' in testEl;
        },

        /**
         * Set to `true` if this browser can create synthetic `MouseEvent` instances.
         * @property {Boolean} EventConstructors
         * @readonly
         */
        EventConstructors: function() {
            var m;

            if (window.MouseEvent) {
                try {
                    m = new MouseEvent('mousedown', { clientX: 100 });
                    // In Edge 12 pageX and pageY can't be set via the MouseEvent or
                    // PointerEvent constructors.  Here we detect that bug by checking
                    // if pageX on the constructed event is different from the clientX
                    // value specified on the config (assumes no document scroll).
                    // If the bug is detected we'll have to fall back to the old-school
                    // initEvent pattern of constructing events
                    if (m.pageX !== 100) {
                        m = false;
                    }
                } catch(e) {
                    // Some older browsers have event contstructors on the window object
                    // but throw errors when they are called
                }
            }

            return !!m;
        },

        /**
         * Set to `true` if this browser can create synthetic `KeyboardEvent` instances.
         * @property {Boolean} KeyboardEventConstructor
         * @readonly
         */
        KeyboardEventConstructor: function() {
            var k;

            if (window.KeyboardEvent) {
                try {
                    k = new KeyboardEvent('keydown', { keyCode: 65 });
                    // In Chrome/Edge keyCode can't be set via the KeyboardEvent constructor
                    // so we have to fall back to the old way of firing key events in those
                    // browsers.
                    if (!k.keyCode) {
                        k = false;
                    }
                } catch(e) {
                    // Some older browsers have event contstructors on the window object
                    // but throw errors when they are called
                }
            }

            return !!k;
        }
    }

    for (var name in supports) {
        if (typeof(value = supports[name]) === 'function') {
            supports[name] = value();
        }
    }
})();
