"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const open = require("opn");
const StringFunctions_1 = require("./StringFunctions");
const crsOutput = require("./CRSOutput");
class MSDocs {
    static GetSearchUrl(SearchString) {
        return StringFunctions_1.StringFunctions.replaceAll(this.BusinessCentralSearchUrl, '<SearchString>', SearchString.split(' ').join('+'));
    }
    static OpenSearchUrl(SearchString) {
        let Url = this.GetSearchUrl(SearchString);
        open(Url);
        crsOutput.showOutput(`OpenSearchUrl ${Url}`);
    }
}
MSDocs.BusinessCentralSearchUrl = 'https://docs.microsoft.com/en-us/search/index?search=<SearchString>&scope=BusinessCentral';
exports.MSDocs = MSDocs;
//# sourceMappingURL=MSDocs.js.map