"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DynamicsNAV_1 = require("../DynamicsNAV");
class RunObjectApi {
    RunObjectInWebClient(objecttype, objectid) {
        DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'WebClient');
    }
    RunObjectInTabletClient(objecttype, objectid) {
        DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'Tablet');
    }
    RunObjectInPhoneClient(objecttype, objectid) {
        DynamicsNAV_1.DynamicsNAV.RunObjectInWebClient(objecttype, objectid, 'Phone');
    }
    RunObjectInWindowsClient(objecttype, objectid) {
        DynamicsNAV_1.DynamicsNAV.RunObjectInWindowsClient(objecttype, objectid);
    }
}
exports.RunObjectApi = RunObjectApi;
//# sourceMappingURL=RunObjectApi.js.map