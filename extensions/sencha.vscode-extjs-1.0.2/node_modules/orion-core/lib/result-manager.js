var ResultManager = function(config) {
    var me = this;
    
    config = config || {};
    
    //me.host = config.host || 'localhost';
    
    me._initDirs();
};

ResultManager.prototype.compareScreenshot = function(name, base64Actual, callback) {
    var fs = require('mz/fs'),
        crypto = require('mz/crypto'),
        nameActual, nameExpected,
        md5Actual, md5Expected,
        base64Expected,
        bitmap;
    
    md5Actual = crypto.createHash('md5').update(base64Actual).digest('hex');
    
    if (!name.toLowerCase().endsWith('.png')) {
        name = name + '.png';
    }
    
    nameActual = 'actual/' + name;
    nameExpected = 'expected/' + name;
    
    //yield fs.writeFile(nameActual, base64Actual, 'base64');
    fs.writeFile(nameActual, base64Actual, 'base64');
    
    fs.exists(nameExpected, function(exists) {
        if (exists) {
            fs.readFile(nameExpected, function(bitmap) {
                base64Expected = new Buffer(bitmap).toString('base64');
                md5Expected = crypto.createHash('md5').update(base64Expected).digest('hex');
                callback(md5Actual == md5Expected);
            });
        } else {
            fs.writeFile(nameExpected, base64Actual, 'base64', function() {
                callback(true);
            });
        }
    });
    
    //if (!(yield fs.exists(nameExpected))) {
    //    yield fs.writeFile(nameExpected, base64Actual, 'base64');
    //    callback(true);
    //    return;
    //}
    //
    //bitmap = yield fs.readFile(nameExpected);
    //base64Expected = new Buffer(bitmap).toString('base64');
    //md5Expected = crypto.createHash('md5').update(base64Expected).digest('hex');
    //
    //callback(md5Actual == md5Expected);
}

ResultManager.prototype._initDirs = function() {
    var fs = require('mz/fs'),
        async = require('async');
    
    async.reject(['actual', 'expected', 'diff'], fs.exists, function(results) {
       async.forEachOf(results, function(dir) {
           fs.mkdir(dir);
       }) 
    });
    
    //if (!(yield fs.exists('actual'))) {
    //    yield fs.mkdir('actual');
    //}
    //
    //if (!(yield fs.exists('expected'))) {
    //    yield fs.mkdir('expected');
    //}
    //
    //if (!(yield fs.exists('diff'))) {
    //    yield fs.mkdir('diff');
    //}
}



module.exports = ResultManager;
