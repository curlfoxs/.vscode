"use strict";

var Base = require('../lib/Base');
var Observable = require('../lib/Observable');

describe('Observable', function () {
    var instance, messages;

    function log () {
        messages.push(Array.prototype.join.call(arguments, ' ').trim());
        //console.log('>' + messages[messages.length - 1] + '<');
    }

    class A extends Observable {
        constructor (id) {
            super();
            this.id = id;
        }

        foo (value) {
            this.fire(Object.assign({
                type: 'foo',
                value: this.id
            }, value));
        }
    }

    class B extends Base {
        static get meta () {
            return {
                mixins: [
                    Observable
                ]
            };
        }

        constructor (id) {
            super();
            this.id = id;
        }

        foo (value) {
            this.fire(Object.assign({
                type: 'foo',
                value: this.id
            }, value));
        }
    }

    beforeEach(function () {
        messages = [];
    });

    function suite (T, useCreate) {
        var calls, ev, scope, that;

        function handler (e) {
            ++calls;
            ev = e;
            that = this;
        }

        beforeEach(function () {
            ev = null;
            calls = 0;
            that = undefined;
        });

        describe('on(name, fn) form', function () {
            beforeEach(function () {
                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                instance.on('foo', handler);
            });

            it('should fire events', function () {
                instance.foo();

                expect(calls).toBe(1);

                expect(ev.type).toBe('foo');
                expect(ev.sender).toBe(instance);
                expect(ev.value).toBe(42);
            });

            it('should not fire after calling un()', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                instance.un('foo', handler);
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);
            });
        });

        describe('on(object) form', function () {
            var token;

            beforeEach(function () {
                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                scope = { name: 'scope' };

                token = instance.on({
                    foo: handler,
                    scope: scope
                });
            });

            it('should fire events', function () {
                instance.foo();

                expect(calls).toBe(1);

                expect(ev.type).toBe('foo');
                expect(ev.sender).toBe(instance);
                expect(ev.value).toBe(42);
                expect(that).toBe(scope);
            });

            it('should not fire after calling un()', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);
            });
        });

        describe('on(object) with delay', function () {
            var fn, token;

            function delayHandler () {
                var ret = handler.apply(this, arguments);
                fn();
                return ret;
            }

            beforeEach(function () {
                fn = null;

                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                scope = { name: 'scope' };

                token = instance.on({
                    foo: delayHandler,
                    delay: 1,
                    scope: scope
                });
            });

            it('should fire events', function (done) {
                fn = function () {
                    expect(calls).toBe(1);

                    expect(ev.type).toBe('foo');
                    expect(ev.sender).toBe(instance);
                    expect(ev.value).toBe(42);
                    expect(that).toBe(scope);

                    done();
                };

                instance.foo();

                expect(calls).toBe(0);

                // fn will be called by delayHandler
            });

            it('should deliver once for each fired event', function (done) {
                var got = [0,0,0];

                fn = function () {
                    ++got[ev.n - 1];

                    if (calls === 3) {
                        expect(calls).toBe(3);
                        expect(got[0]).toBe(1);
                        expect(got[1]).toBe(1);
                        expect(got[2]).toBe(1);

                        expect(ev.type).toBe('foo');
                        expect(ev.sender).toBe(instance);
                        expect(ev.value).toBe(42);
                        expect(that).toBe(scope);

                        done();
                    }
                    // we'll timeout if we don't get all 3 calls
                };

                instance.foo({ n: 1 });
                expect(calls).toBe(0);

                instance.foo({ n: 2 });
                expect(calls).toBe(0);

                instance.foo({ n: 3 });
                expect(calls).toBe(0);

                // fn will be called by delayHandler
            });

            it('should not fire after calling un()', function (done) {
                fn = function () {
                    fail();
                    done();
                };

                expect(instance.getListenerCount('foo')).toBe(1);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);

                // Give it 100ms and if it hasn't fired in that time we call it good.
                setTimeout(function () {
                    done();
                }, 100);
            });
        });

        describe('on(object) with buffer', function () {
            var fn, token;

            function delayHandler () {
                var ret = handler.apply(this, arguments);
                fn();
                return ret;
            }

            beforeEach(function () {
                fn = null;

                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                scope = { name: 'scope' };

                token = instance.on({
                    foo: delayHandler,
                    buffer: 1,
                    scope: scope
                });
            });

            it('should fire events', function (done) {
                fn = function () {
                    expect(calls).toBe(1);

                    expect(ev.type).toBe('foo');
                    expect(ev.sender).toBe(instance);
                    expect(ev.value).toBe(42);
                    expect(that).toBe(scope);

                    done();
                };

                instance.foo();

                expect(calls).toBe(0);

                // fn will be called by delayHandler
            });

            it('should deliver once for multiple fired events', function (done) {
                fn = function () {
                    expect(calls).toBe(1);

                    if (calls === 1) {
                        expect(ev.type).toBe('foo');
                        expect(ev.sender).toBe(instance);
                        expect(ev.value).toBe(42);
                        expect(ev.n).toBe(3);  // from the last fired event
                        expect(that).toBe(scope);

                        // Give it 100ms more to make sure we only get one delivery
                        setTimeout(function () {
                            done();
                        }, 100);
                    }
                };

                instance.foo({ n: 1 });
                expect(calls).toBe(0);

                instance.foo({ n: 2 });
                expect(calls).toBe(0);

                instance.foo({ n: 3 });
                expect(calls).toBe(0);

                // fn will be called by delayHandler
            });

            it('should not fire after calling un()', function (done) {
                fn = function () {
                    fail();
                    done();
                };

                expect(instance.getListenerCount('foo')).toBe(1);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);

                // Give it 100ms and if it hasn't fired in that time we call it good.
                setTimeout(function () {
                    done();
                }, 100);
            });
        });

        describe('on(object) with single', function () {
            var token;

            beforeEach(function () {
                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                scope = { name: 'scope' };

                token = instance.on({
                    foo: handler,
                    single: true,
                    scope: scope
                });
            });

            it('should fire events', function () {
                instance.foo();

                expect(calls).toBe(1);

                expect(ev.type).toBe('foo');
                expect(ev.sender).toBe(instance);
                expect(ev.value).toBe(42);
                expect(that).toBe(scope);
            });

            it('should deliver once for multiple fired events', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                instance.foo({ n: 1 });
                expect(instance.getListenerCount('foo')).toBe(0);

                expect(calls).toBe(1);

                expect(ev.type).toBe('foo');
                expect(ev.sender).toBe(instance);
                expect(ev.value).toBe(42);
                expect(ev.n).toBe(1);  // from the first fired event
                expect(that).toBe(scope);

                instance.foo({ n: 2 });

                expect(calls).toBe(1);
                expect(instance.getListenerCount('foo')).toBe(0);

                expect(ev.n).toBe(1);  // from the first fired event
            });

            it('should not fire after calling un()', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);
            });
        });

        describe('managed on(object) form', function () {
            var token;

            beforeEach(function () {
                if (useCreate) {
                    instance = T.create(42);
                } else {
                    instance = new T(42);
                }

                scope = new Observable();
                scope.name = 'managed-scope';

                token = instance.on({
                    foo: handler,
                    scope: scope
                });
            });

            it('should fire events', function () {
                instance.foo();

                expect(calls).toBe(1);

                expect(ev.type).toBe('foo');
                expect(ev.sender).toBe(instance);
                expect(ev.value).toBe(42);
                expect(that).toBe(scope);
            });

            it('should have no listeners after calling un()', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);
            });

            it('should not fire after calling un()', function () {
                token.destroy();
                instance.foo();

                expect(calls).toBe(0);
            });

            it('should have no listeners after managed listener is destroyed', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                scope.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);
            });

            it('should not fire after managed listener is destroyed', function () {
                scope.destroy();
                instance.foo();

                expect(calls).toBe(0);
            });

            it('should still be un()able after managed listener is destroyed', function () {
                expect(instance.getListenerCount('foo')).toBe(1);
                scope.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);
                token.destroy();
                expect(instance.getListenerCount('foo')).toBe(0);

                instance.foo();

                expect(calls).toBe(0);
            });
        });
    }

    describe('used via extends and create', function () {
        suite(A, true);
    });

    describe('used via extends and operator new', function () {
        suite(A, false);
    });

    describe('used via mixins and create', function () {
        suite(B, true);
    });

    describe('used via mixins and operator new', function () {
        suite(B, false);
    });
});
