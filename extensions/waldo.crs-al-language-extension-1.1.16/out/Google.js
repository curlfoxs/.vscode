"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const open = require("opn");
const StringFunctions_1 = require("./StringFunctions");
const crsOutput = require("./CRSOutput");
class Google {
    static GetSearchUrl(SearchString) {
        return StringFunctions_1.StringFunctions.replaceAll(this.BusinessCentralSearchUrl, '<SearchString>', SearchString.split(' ').join('+'));
    }
    static OpenSearchUrl(SearchString) {
        let Url = this.GetSearchUrl(SearchString);
        open(Url);
        crsOutput.showOutput(`OpenSearchUrl ${Url}`);
    }
}
Google.BusinessCentralSearchUrl = 'http://www.google.com/search?q=<SearchString>+Business+Central';
exports.Google = Google;
//# sourceMappingURL=Google.js.map