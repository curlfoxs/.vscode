var Util = require('orion-core/lib/Util');
if (Util.isWin) {
    var File = require('orion-core/lib/fs/File');
// for windows file operations we DON'T set the separator to something else...

    describe("WindowsFileOperations",function() {
        describe("_winFindFileLineToFile", function() {
            it("should return null for invalid lines", function() {
                var f = new File();
                var lines = [
                    "",
                    null,
                    undefined,
                    '1/2/3/4/5',
                    "ABCD/junk/junk/junk/junk/filename",
                    "ABCD/1436508017/junk/junk/junk/filename",
                    "ABCD/1436508017/1436508017/junk/junk/filename",
                    "ABCD/1460495865/1436508017/1436508017/junk/filename",
                ];
                for(var i=0; i < lines.length; i++) {
                    expect(f._winFindFileLineToFile(lines[i])).toBeFalsy(lines[i]);
                }
            });
            it("should return a stat object for valid lines", function() {
                var f = File.get("c:/");
                var lines = ["HSD/1436508262/1459431732/1459431732/0/$Recycle.Bin",
                    "D/1438301490/1438301491/1438301491/0/BGinfo",
                    "HSD/1438337210/1459498596/1459498596/0/Boot",
                    "AHRS/1436516406/1459498596/1436508031/395268/bootmgr",
                    "AHS/1436516406/1459498596/1436508031/1/BOOTNXT",
                    "AHRS/1438337210/1438337210/1438337210/8192/BOOTSECT.BAK",
                    "HSD/1436512898/1436512898/1436512898/0/Documents and Settings",
                    "D/1460378807/1460378807/1460378807/0/Microsoft",
                    "D/1460364541/1460366954/1460366954/0/node",
                    "D/1459506503/1459948456/1459948456/0/orion",
                    "D/1460031317/1460041716/1460041716/0/orion-620-old",
                    "AHS/1438333637/1438333637/1460472084/2022334464/pagefile.sys",
                    "D/1436508262/1436508262/1436508262/0/PerfLogs",
                    "RD/1436501128/1460377095/1460377095/0/Program Files",
                    "RD/1436501128/1459869500/1459869500/0/Program Files (x86)",
                    "HD/1436508262/1459869016/1459869016/0/ProgramData",
                    "D/1459867051/1459867095/1459867095/0/Python27",
                    "HSD/1438333706/1438333706/1438333706/0/Recovery",
                    "AHS/1438333637/1438333637/1460140841/268435456/swapfile.sys",
                    "HSD/1438333636/1460377010/1460377010/0/System Volume Information",
                    "D/1460121774/1460389505/1460389505/0/tmp",
                    "RD/1436501128/1438302432/1438302432/0/Users",
                    "D/1436501128/1460111168/1460111168/0/Windows",
                    "D/1460495865/1460495865/1460495865/0/winxp"];
                for(var i=0; i < lines.length; i++) {
                    expect(f._winFindFileLineToFile(f,lines[i])).toBeTruthy(lines[i]);
                }
                for(var i=0; i < lines.length; i++) {
                    var f2 = f._winFindFileLineToFile(f,lines[i]);
                    // console.log(f2);
                    expect(f2).toBeDefined();
                    expect(f2.stat).toBeDefined();
                    expect(f2.stat.attrib).toBeDefined();
                }
            });
        });
    });
}
