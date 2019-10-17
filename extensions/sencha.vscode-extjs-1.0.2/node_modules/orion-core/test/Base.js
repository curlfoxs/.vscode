"use strict";

var Base = require('../lib/Base');

describe('Base', function () {
    describe('mixins', function () {
        var Test,
            messages;
        
        function log () {
            messages.push(Array.prototype.join.call(arguments, ' ').trim());
            //console.log('>' + messages[messages.length - 1] + '<');
        }
        
        beforeEach(function () {
            messages = [];

            class A extends Base {
                static get meta () {
                    return {
                        extended: function (T) {
                            log('extended A -', T.name);
                        }
                    };
                }

                constructor (id) {
                    super(id);
                    log('construct A', this.id);
                }

                ctor () {
                    this.id = this.$config;
                    log('ctor A', this.id);
                }
                dtor () {
                    log('dtor A', this.id);
                }
            }

            class B extends A {
                constructor (id) {
                    super(id);
                    log('construct B', this.id);
                }

                ctor () {
                    log('ctor B', this.id);
                }
                dtor () {
                    log('dtor B', this.id);
                }
            }

            class M extends Base {
                static get meta () {
                    return {
                        mixinId: 'm',

                        extended: function (T) {
                            if (this.isPrototypeOf(T)) {
                                log('extended M -', T.name);
                            } else {
                                log('extended mixture M -', T.name);
                            }
                        },

                        mixed: function (T) {
                            log('mixed M -', T.name);
                        }
                    };
                }

                constructor () {
                    super();
                    log('construct M', this.id);
                }

                ctor () {
                    log('ctor M', this.id);
                }
                dtor () {
                    log('dtor M', this.id);
                }
            }

            class C extends B {
                constructor (id) {
                    super(id);
                    log('construct C', this.id);
                }

                ctor () {
                    log('ctor C', this.id);
                }
                dtor () {
                    log('dtor C', this.id);
                }
            }

            // Use immediate decoration
            C.decorate({
                mixins: [
                    M
                ],

                extended: function (T) {
                    log('extended C -', T.name);
                }
            });

            class M2 extends Base {
                static get meta () {
                    return {
                        mixinId: 'm2',

                        extended: function (T) {
                            if (this.isPrototypeOf(T)) {
                                log('extended M2 -', T.name);
                            } else {
                                log('extended mixture M2 -', T.name);
                            }
                        },

                        mixed: function (T) {
                            log('mixed M2 -', T.name);
                        }
                    };
                }

                constructor () {
                    super();
                    log('construct M2', this.id);
                }

                ctor () {
                    log('ctor M2', this.id);
                }
                dtor () {
                    log('dtor M2', this.id);
                }

                method (x) {
                    log('M2.method', this.id, x);
                }

                static method (x) {
                    log('M2.smethod', this.name, x);
                }
            }

            class D extends C {
                static get meta () {
                    return {
                        mixins: [
                            M2
                        ]
                    };
                }

                constructor (id) {
                    super(id);
                    log('construct D', this.id);
                }

                ctor () {
                    log('ctor D', this.id);
                }
                dtor () {
                    log('dtor D', this.id);
                }

                method (x) {
                    log('D.method', this.id, x);
                    this.mixins.m2.method.call(this, x);
                }

                static method (x) {
                    log('D.smethod', x);
                    this.mixins.m2.method.call(this, x);
                }
            }

            Test = {
                A: A,
                B: B,
                C: C,
                D: D,
                M: M,
                M2: M2
            };
        }); // beforeEach

        var constructorA, constructorB, constructorC, constructorD;
        var constructorM, constructorM2;
        var ctorA, ctorB, ctorC, ctorD, ctorM, ctorM2;
        var dtorA, dtorB, dtorC, dtorD, dtorM, dtorM2;
        var created, destroyed;
        var methodD, methodM2;
        var smethodD, smethodM2;
        var extendedA_B, extendedA_C, extendedA_D, extendedC_D, extendedMixedM_D;
        var mixedM_C, mixedM2_D;

        function snapshot () {
            /*
                extended A - B
                extended A - C
                mixed M - C
                extended A - D
                extended mixture M - D
                extended C - D
                mixed M2 - D

                ctor A 42
                ctor B 42
                ctor M 42
                ctor C 42
                ctor M2 42
                ctor D 42
                construct A 42
                construct B 42
                construct C 42
                construct D 42
                created 42
                D.method 42 abc
                M2.method 42 abc
                D.smethod xyz
                M2.smethod D xyz
                dtor D 42
                dtor M2 42
                dtor C 42
                dtor M 42
                dtor B 42
                dtor A 42
                destroyed 42
             */
            extendedA_B      = messages.indexOf('extended A - B');
            extendedA_C      = messages.indexOf('extended A - C');
            mixedM_C         = messages.indexOf('mixed M - C');
            extendedA_D      = messages.indexOf('extended A - D');
            extendedMixedM_D = messages.indexOf('extended mixture M - D');
            extendedC_D      = messages.indexOf('extended C - D');
            mixedM2_D        = messages.indexOf('mixed M2 - D');

            constructorA = messages.indexOf('construct A 42');
            constructorB = messages.indexOf('construct B 42');
            constructorC = messages.indexOf('construct C 42');
            constructorD = messages.indexOf('construct D 42');
            constructorM = messages.indexOf('construct M 42');
            constructorM2 = messages.indexOf('construct M2 42');

            ctorA = messages.indexOf('ctor A 42');
            ctorB = messages.indexOf('ctor B 42');
            ctorC = messages.indexOf('ctor C 42');
            ctorD = messages.indexOf('ctor D 42');
            ctorM = messages.indexOf('ctor M 42');
            ctorM2 = messages.indexOf('ctor M2 42');

            dtorA = messages.indexOf('dtor A 42');
            dtorB = messages.indexOf('dtor B 42');
            dtorC = messages.indexOf('dtor C 42');
            dtorD = messages.indexOf('dtor D 42');
            dtorM = messages.indexOf('dtor M 42');
            dtorM2 = messages.indexOf('dtor M2 42');

            created = messages.indexOf('created 42');
            destroyed = messages.indexOf('destroyed 42');

            methodD = messages.indexOf('D.method 42 abc');
            methodM2 = messages.indexOf('M2.method 42 abc');
            smethodD = messages.indexOf('D.smethod xyz');
            smethodM2 = messages.indexOf('M2.smethod D xyz');
        }

        describe('extended and mixed hooks', function () {
            beforeEach(function () {
                var instance = new Test.D(42);

                log('created', instance.id);

                instance.destroy();

                log('destroyed', instance.id);

                snapshot();
            });

            it('should extend A with B first', function () {
                expect(extendedA_B).toBe(0);
            });
            it('should extend A with C after B', function () {
                expect(extendedA_C).toBe(extendedA_B + 1);
            });
            it('should mix M into C after C extends B', function () {
                expect(mixedM_C).toBe(extendedA_C + 1);
            });
            it('should extend A with D', function () {
                expect(extendedA_D).toBe(mixedM_C + 1);
            });
            it('should extend mixin M with D via C', function () {
                expect(extendedMixedM_D).toBe(extendedA_D + 1);
            });
            it('should extend C with D', function () {
                expect(extendedC_D).toBe(extendedMixedM_D + 1);
            });
            it('should mix M2 into D after extending C', function () {
                expect(mixedM2_D).toBe(extendedC_D + 1);
            });
        });

        describe('lifecycle', function () {
            describe('C', function () {
                beforeEach(function () {
                    var instance = new Test.C(42);

                    log('created', instance.id);

                    instance.destroy();

                    log('destroyed', instance.id);

                    snapshot();
                });

                it('should call constructor A after ctors', function () {
                    expect(constructorA).toBe(ctorC + 1);
                });
                it('should call constructor B after constructor A', function () {
                    expect(constructorB).toBe(constructorA + 1);
                });
                it('should call constructor C after constructor B', function () {
                    expect(constructorC).toBe(constructorB + 1);
                });
                it('should not call constructor D', function () {
                    expect(constructorD).toBe(-1);
                });

                it('should not call mixin M constructor', function () {
                    expect(constructorM).toBe(-1);
                });
                it('should not call mixin M2 constructor', function () {
                    expect(constructorM2).toBe(-1);
                });

                it('should call ctor for A first', function () {
                    expect(ctorA).toBe(mixedM_C + 1);
                });
                it('should call ctor for B after ctor for A', function () {
                    expect(ctorB).toBe(ctorA + 1);
                });
                it('should call ctor for M after ctor for B', function () {
                    expect(ctorM).toBe(ctorB + 1);
                });
                it('should call ctor for C after ctor for M', function () {
                    expect(ctorC).toBe(ctorM + 1);
                });

                it('should not call ctor for M2', function () {
                    expect(ctorM2).toBe(-1);
                });
                it('should not call ctor for D', function () {
                    expect(ctorD).toBe(-1);
                });
                
                it('should not call dtor for D', function () {
                    expect(dtorD).toBe(-1);
                });
                it('should not call dtor for M2', function () {
                    expect(dtorM2).toBe(-1);
                });

                it('should call dtor for C first', function () {
                    expect(dtorC).toBe(created + 1);
                });
                it('should call dtor for M after dtor for C', function () {
                    expect(dtorM).toBe(dtorC + 1);
                });
                it('should call dtor for B after dtor for M', function () {
                    expect(dtorB).toBe(dtorM + 1);
                });
                it('should call dtor for A after dtor for B', function () {
                    expect(dtorA).toBe(dtorB + 1);
                });

                it('should call destroyers before destroy() returns', function () {
                    expect(destroyed).toBe(dtorA + 1);
                });
            });

            describe('D', function () {
                beforeEach(function () {
                    var d = new Test.D(42);
                    log('created', d.id);
                    d.destroy();
                    log('destroyed', d.id);

                    snapshot();
                });

                it('should call constructor A first', function () {
                    expect(constructorA).toBe(ctorD + 1);
                });
                it('should call constructor B after constructor A', function () {
                    expect(constructorB).toBe(constructorA + 1);
                });
                it('should call constructor C after constructor B', function () {
                    expect(constructorC).toBe(constructorB + 1);
                });
                it('should call constructor D after constructor C', function () {
                    expect(constructorD).toBe(constructorC + 1);
                });

                it('should not call mixin M constructor', function () {
                    expect(constructorM).toBe(-1);
                });
                it('should not call mixin M2 constructor', function () {
                    expect(constructorM2).toBe(-1);
                });

                it('should call ctor for A first', function () {
                    expect(ctorA).toBe(mixedM2_D + 1);
                });
                it('should call ctor for B after ctor for A', function () {
                    expect(ctorB).toBe(ctorA + 1);
                });
                it('should call ctor for M after ctor for B', function () {
                    expect(ctorM).toBe(ctorB + 1);
                });
                it('should call ctor for C after ctor for M', function () {
                    expect(ctorC).toBe(ctorM + 1);
                });
                it('should call ctor for M2 after ctor for C', function () {
                    expect(ctorM2).toBe(ctorC + 1);
                });
                it('should call ctor for D after ctor for M2', function () {
                    expect(ctorD).toBe(ctorM2 + 1);
                });

                it('should call dtor for D first', function () {
                    expect(dtorD).toBe(created + 1);
                });
                it('should call dtor for M2 after dtor for D', function () {
                    expect(dtorM2).toBe(dtorD + 1);
                });
                it('should call dtor for C after dtor for M2', function () {
                    expect(dtorC).toBe(dtorM2 + 1);
                });
                it('should call dtor for M after dtor for C', function () {
                    expect(dtorM).toBe(dtorC + 1);
                });
                it('should call dtor for B after dtor for M', function () {
                    expect(dtorB).toBe(dtorM + 1);
                });
                it('should call dtor for A after dtor for B', function () {
                    expect(dtorA).toBe(dtorB + 1);
                });

                it('should call destroyers before destroy() returns', function () {
                    expect(destroyed).toBe(dtorA + 1);
                });
            }); // D
        }); // lifecycle

        describe('methods', function () {
            beforeEach(function () {
                var d = new Test.D(42);
                log('created', d.id);
                d.method('abc');
                Test.D.method('xyz');
                d.destroy();
                log('destroyed', d.id);

                snapshot();
            });

            it('should call instance methods', function () {
                expect(methodD).toBe(created + 1);
            });

            it('should call instance methods of mixins', function () {
                expect(methodM2).toBe(methodD + 1);
            });

            it('should call static methods', function () {
                expect(smethodD).toBe(methodM2 + 1);
            });

            it('should call static methods of mixins', function () {
                expect(smethodM2).toBe(smethodD + 1);
            });
        });
    });
});
