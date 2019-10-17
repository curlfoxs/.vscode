var fs = require('fs');
var xfs = require('./xfs');
const JSON5 = require('json5');

const objectExtractRe = /^[^{]*({[\s\S]*})[^}]*$/m;
const arrayExtractRe = /^[^[]*(\[[\s\S]*\])[^\]]*$/m;

var Json = {
    parse (text) {
        return JSON5.parse(text);
    },

    parseFrom (text) {
        var data,
            objPos = text.indexOf('{'),
            arrPos = text.indexOf('['),
            re = arrayExtractRe,
            re2 = objectExtractRe;

        if (objPos >= 0 && (arrPos < 0 || objPos < arrPos)) {
            // found-object && (no-array or object-before-array)
            re = objectExtractRe;
            re2 = arrayExtractRe;
        }

        if (!(data = re.exec(text))) {
            data = re2.exec(text);
        }
        
        if (!data) {
            throw new Error('No data found');
        }

        return JSON.parse(data[1]);
    },

    read (jsonFile, encoding) {
        return new Promise(function(resolve, reject) {
            fs.readFile(jsonFile, encoding || 'utf8', function (error, content) {
                if (error) {
                    reject(xfs.wrapError(jsonFile, error));
                } else {
                    try {
                        resolve(Json.parse(content));
                    } catch (e) {
                        reject(xfs.wrapError(jsonFile, e));
                    }
                }
            });
        });
    },
    
    write (jsonFile, data) {
        var content = JSON.stringify(data, null, 4);
        return xfs.writeFile(jsonFile, content);
    },

    readSync (jsonFile, encoding) {
        try {
            var content = fs.readFileSync(jsonFile, encoding || 'utf8');

            return Json.parse(content);
        } catch (e) {
            throw xfs.wrapError(jsonFile, e);
        }
    },

    writeSync (jsonFile, data) {
        var content = JSON.stringify(data, null, 4);

        fs.writeFileSync(jsonFile, content);
    }
};

module.exports = Json;
