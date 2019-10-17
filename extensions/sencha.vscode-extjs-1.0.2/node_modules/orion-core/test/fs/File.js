var File = require('orion-core/lib/fs/File');
var Util = require('orion-core/lib/Util');
var Path = require('path');
var os = require('os');
var child_process = require('child_process');

File.setSeparator('/');

describe('File', function(){

    var osTmpDir = new File(os.tmpDir());
    var tmpDir = new File(osTmpDir,"orionTestTemp");
    var rootdir = new File("/"); // works everywhere right?

    describe('trimSlash', function() {
        it("should trim slashes regardless of type",function() {
            expect(new File("/foo").trimSlash()).toBe("/foo");
            expect(new File("/foo/").trimSlash()).toBe("/foo");
            expect(new File("\\foo").trimSlash()).toBe("\\foo");
            expect(new File("\\foo\\").trimSlash()).toBe("\\foo");
            expect(new File("").trimSlash()).toBe("");
            expect(new File().trimSlash()).toBe("");
        })
    })

    describe("equals",function() {
        it("finds equals values properly",function() {
            // save values for resetting after test run
            var isWin = Util.isWin,
                isMac = Util.isMac,
                isLinux = Util.isLinux;

            expect(new File("/foo").equals(new File("/foo/"))).toBeTruthy();
            expect(new File("/foo/").equals(new File("/foo"))).toBeTruthy();
            expect(new File("\\foo").equals(new File("\\foo\\"))).toBeTruthy();
            expect(new File("\\foo\\").equals(new File("\\foo"))).toBeTruthy();


            // Mac and Windows are case insensitive
            Util.isWin = false;
            Util.isMac = true;
            Util.isLinux = false;
            expect(new File("/foo").equals(new File("/FOO"))).toBeTruthy();

            Util.isWin = true;
            Util.isMac = false;
            Util.isLinux = false;
            expect(new File("/foo").equals(new File("/FOO"))).toBeTruthy();

            Util.isWin = false;
            Util.isMac = false;
            Util.isLinux = true;
            // linux case is case SENSITIVE
            expect(new File("/foo").equals(new File("/FOO"))).toBeFalsy();

            // reset for other tests
            Util.isWin = isWin;
            Util.isMac = isMac;
            Util.isLinux = isLinux;
        });
    });
    
    describe("ensurePathExists",function() {
        it("should create multiple sub-dirs",function(done) {
            var sub1 = new File(tmpDir,"sub1");
            var sub2 = new File(sub1,"sub2");
            sub2.ensurePathExists().then(function(result) {
                // console.log("resolved with result=",result);
                done();
            }, function(err) {
                // console.log("rejected with err=",err);
                done;
            });
        });
    });

    describe("join", function() {
        it("should join paths", function() {
            expect(File.join('foo/bar/', '/baz/')).toBe('foo/bar/baz');
        });

        it("should preserve leading slash", function() {
            expect(File.join('/foo/bar/', '/baz/')).toBe('/foo/bar/baz');
        });

        it("should accept parts", function() {
            expect(File.join('foo', 'bar', 'baz')).toBe('foo/bar/baz');
        });

        it("should accept parts with leading slash", function() {
            expect(File.join('', 'foo', 'bar', 'baz')).toBe('/foo/bar/baz');
        });
    });

    describe('getFiles and getFilesSync should return sorted items.', function() {
        // CRAIG TODO
    });

    describe('getFilesSync', function() {
        it('should get files or folders at the root path', function() {
            var files = rootdir.getFilesSync();
            // console.log(files);
            expect(files.length).toBeGreaterThan(0);
        });
        it('should get the right number of files for a temp dir fixture', function() {
            var mydir = new File(tmpDir,"mydir");
            try {
                mydir.removeSync();
            } catch (e) {
                // don't care about result, should be empty.
            }
            var myfile = new File(mydir,"test.txt");
            myfile.writeSync("testdata"); // causes the dir and file to be created
            var files = mydir.getFilesSync();
            // console.log(files);
            expect(files.length).toBe(1);
            expect(files[0].name).toBe(myfile.name);
        })
        it('should ??? for an invalid path',function() {
            var f = new File('|');
            try {
                expect(new File('|').getFilesSync()).toThrow();
                fail("should have thrown an error");
            } catch (e) {
                // expected
            }
            // console.log(files);
        });
    });

    describe('getStat', function() {
        it('should get stat of a directory', function(done) {
            tmpDir.getStat().then(function(stat) {
                expect(stat).toBeDefined();
                expect(stat.isDirectory()).toBe(true);
                expect(stat.isFile()).toBe(false);
                expect(stat.atime).toBeDefined();
                expect(stat.mtime).toBeDefined();
                expect(stat.ctime).toBeDefined();
                expect(stat.birthtime).toBeDefined();

                // console.log("stat=",stat);
                done();
            }, function(err) {
                fail(err);
                // console.log("err=",err);
                done();
            });
        });
        it('should get a stat of a file', function(done) {
            var tmpFile = new File(tmpDir,"tmpFile.txt");
            tmpFile.writeSync("foobar");
            tmpFile.getStat().then(function(stat) {
                expect(stat).toBeDefined();
                expect(stat.isDirectory()).toBe(false);
                expect(stat.isFile()).toBe(true);
                expect(stat.atime).toBeDefined();
                expect(stat.ctime).toBeDefined();
                expect(stat.mtime).toBeDefined();
                expect(stat.birthtime).toBeDefined();
                // console.log(stat);
                done();
            }, function(err) {
                fail(err);
                done();
            });
        });
        it('should return false for a non existent file', function(done) {
            var tmpFile = new File(tmpDir,"notThere.txt");
            tmpFile.getStat().then(function(stat) {
                expect(stat).toBe(false);
                done();
            },function(err) {
                fail(err);
                done();
            });
        });
    });

    if (Util.isWin) {
        File.setStuPath('../../Studio/files/stu');

        describe("Windows Tests", function() {

            describe("get stu path",function() {
                it("deals with root dir / properly", function() {
                    expect(WindowsFileOperations.getStuDirArg("/")).toBe("/*");
                });
                it("deals with a directory already ending in / properly", function() {
                    expect(WindowsFileOperations.getStuDirArg("/foobar/")).toBe("/foobar/*");
                });
                it("deals with a directory without ending /", function() {
                    expect(WindowsFileOperations.getStuDirArg("/foobar")).toBe("/foobar/*");
                });
            });

            // CRAIG TODO refactor so this works on both Windows and UNIX.
            // should just entail figuring out the root, adjusting hide() to prepend a dot and rename things on UNIX.
            describe("Windows isHidden Tests", function() {

                // assumes C:, probably OK
                var hiddenDir,
                    notHiddenDir,
                    hiddenFile,
                    notHiddenFile,
                    inHiddenDir,
                    inNotHiddenDir;

                // helper function for hidden tests... TODO refactor as attrib function
                // in WindowsFileOperations.js.
                cmdSync = function (cmd,args) {
                    var proc = child_process.spawnSync(cmd, args, {encoding: 'utf8'});
                    // console.log(proc);
                    if (proc.status != 0) {
                        throw new Error("unable to spawn cmd="+cmd+", args="+args+", proc.stderr=", proc.stderr);
                    }
                    return proc.stdout;
                }
                hide = function(path) {
                    cmdSync('attrib',[path,'+h']);
                }
                unhide = function(path) {
                    cmdSync('attrib',[path,'-h']);
                }

                // for some reason grunt doing jasmine-node-coverage doesn't like beforeAll
                beforeAll(function(done) {
                // it('setup',function(done) {
                //     tmpDir = new File("c:/orionCoreTestTemp");
                    tmpDir.remove().then(function (result) {
                        // CRAIG TODO actually I don't really care if it succeeds or fails...
                        // if (!result) {
                        //     done();
                        //     throw new Error("tmpDir.remove() failed");
                        // }
                        //
                        try {
                            // console.log("tmpDir.remove() result=", result);

                            hiddenDir = new File(tmpDir, "hiddenDir");
                            notHiddenDir = new File(tmpDir, "notHiddenDir");
                            hiddenFile = new File(tmpDir, "hidden.txt");
                            notHiddenFile = new File(tmpDir, "notHidden.txt");
                            inHiddenDir = new File(hiddenDir, "inHiddenDir.txt");
                            inNotHiddenDir = new File(notHiddenDir, "inNotHiddenDir.txt");

                            hiddenFile.writeSync("hiddenFile");
                            notHiddenFile.writeSync("notHiddenFile");
                            inHiddenDir.writeSync("inHiddenDir");
                            inNotHiddenDir.writeSync("inNotHiddenDir");
                            hide(hiddenDir.path);
                            hide(hiddenFile.path);
                        } catch (e) {
                            console.log(e.stack); // added to debug failures in writeSync()
                        }
                        done();
                    },function(err) {
                        console.log("ERROR removing tmpDir");
                    });
                });

                assertGetFilesResults = function(files, recursive) {
                    var found = 0;
                    for(var i=0; i < files.length; i++) {
                        // console.log("files["+i+"]=",files[i]);

                        switch(files[i].name) {
                            case hiddenDir.name :
                                found++;
                                if (recursive) {
                                    expect(files[i].items).toBeDefined();
                                    if(files[i].items) {
                                        expect(files[i].items[0].name).toEqual(inHiddenDir.name);
                                    }
                                }
                                break;
                            case notHiddenDir.name :
                                found++;
                                if (recursive) {
                                    expect(files[i].items).toBeDefined();
                                    if(files[i].items) {
                                        expect(files[i].items[0].name).toEqual(inNotHiddenDir.name);
                                    }
                                }
                                break;
                            case hiddenFile.name : found++; break;
                            case notHiddenFile.name : found++; break;
                        }
                    }
                    expect(found).toBe(4);
                }

                // afterAll(function (done) {
                //     tmpDir.remove().then(function(result) {
                //         console.log("tmpDir.remove() result=",result);
                //         done();
                //     });
                // });

                describe("isHidden", function () {
                    it("should detect a hidden file", function () {
                        expect(hiddenFile.isHidden()).toBe(true);
                    });
                    it("should detect a hidden directory", function () {
                        expect(hiddenDir.isHidden()).toBe(true);
                    });
                    it("should detect a not hidden file", function () {
                        expect(notHiddenFile.isHidden()).toBe(false);
                    });
                    it("should detect a not hidden directory", function () {
                        expect(notHiddenDir.isHidden()).toBe(false);
                    });
                    it("should NOT detect a change in hidden state", function () {
                        expect(notHiddenDir.isHidden()).toBe(false);
                        hide(notHiddenDir.path);
                        expect(notHiddenDir.isHidden()).toBe(false);
                        unhide(notHiddenDir.path); // to clean up for other tests.
                    })
                });

                describe("getFiles (async)", function () {
                    // TODO previous behavior INCLUDED hidden directories on getFiles calls.
                    it("should recursively get files excluding hidden directories", function (done) {
                        tmpDir.getFiles(true).then(function (files) {
                            // console.log(files);
                            assertGetFilesResults(files,true);
                            done();
                        });
                    });
                    it("should get files excluding hidden directories", function (done) {
                        tmpDir.getFiles(false).then(function (files) {
                            // console.log(files);
                            assertGetFilesResults(files,false);
                            done();
                        },fail);
                    });
                    it("should return empty array when no files are found", function (done) {
                        var newDir = new File(tmpDir,"new");
                        newDir.ensurePathExists().then(function(result) {
                            // console.log("ensurePathExists resolved with result=",result);
                            newDir.getFiles(false).then(function(files) {
                                expect(files).toBeDefined();
                                expect(files.length).toBe(0);
                                done();
                            },function(err) {
                                fail("should have returned empty array when no files found");
                                done();
                            });
                        },function() {
                            fail("should not have thrown exception on ensurePathExists()");
                            done();
                        });
                    });
                });

                describe("getFilesSync", function () {
                    // TODO previous behavior WOULD include hidden directories, such as
                    // to find .sencha/package/*
                    //
                    it("should recursively get files excluding hidden directories", function () {
                        var files = tmpDir.getFilesSync(true);
                        assertGetFilesResults(files,true);
                    });
                    it("should get files excluding hidden directories", function () {
                        var files = tmpDir.getFilesSync(false);
                        assertGetFilesResults(files,false);
                    });
                });


                // it('teardown', function (done) {
                afterAll(function (done) {
                    tmpDir.remove().then(function(result) {
                        // console.log("tmpDir.remove() result=",result);
                        done();
                    });
                });
            });

            describe("isFile", function() {
                it("should detect files on windows", function() {
                    expect(new File("c:/windows/win.ini").isFile()).toBeTruthy();
                });
                it("should detect NOT files on windows", function() {
                    expect(new File("c:/windows").isFile()).toBeFalsy();
                });
            });

            describe("isDirectory", function() {
                it("should detect directories on windows", function() {
                    expect(new File("c:/windows").isDirectory()).toBeTruthy();
                });
                it("should detect NOT directories on windows", function() {
                    expect(new File("c:/windows/win.ini").isDirectory()).toBeFalsy();
                });
            });

            describe("getFilesSync", function() {
                it("should NOT recursively get files in c:/windows", function() {
                    var f = new File("c:/windows");
                    var files = f.getFilesSync(false);
                    // expectations TODO!!!
                    // files.forEach(function(file) {
                    //     console.log(file);
                    //     console.log("hidden?"+file.isHidden());
                    //     console.log("file?"+file.isFile());
                    //     console.log("dir?"+file.isDirectory());
                    // });
                });
                it("should throw an error for missing directory", function() {
                    var f = new File("C:/this-does-not-exist");
                    try {
                        expect(f.getFilesSync(false)).toThrow();
                        var files = f.getFilesSync(false);
                        fail("should have thrown an error");
                    } catch (e) {
                        // expected!
                    }
                });
            });

            describe("getStatSync", function() {
                it("should throw an error if the stu executable cannot be found",function() {
                    var savePath = WindowsFileOperations.getStuPath();
                    WindowsFileOperations.setStuPath('/junk');
                    try {
                        new File("c:/windows").getStatSync();
                        fail("expected junk stuPath to throw an error");
                    } catch(e) {
                        // expected
                    }
                    WindowsFileOperations.setStuPath(savePath); // restore for other tests.
                });
                it("should get attributes of a directory", function() {
                    var stat = new File("c:/windows").getStatSync();
                    expect(stat.attrib).toBeDefined();
                });
                it("should get attributes of a file", function() {
                    var stat = new File("c:/windows/win.ini").getStatSync();
                    expect(stat.attrib).toBeDefined();
                });
            });
        });
    }
});