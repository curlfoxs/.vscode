"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DynamicsNAV_1 = require("../DynamicsNAV");
const NAVObject_1 = require("../NAVObject");
const Settings_1 = require("../Settings");
class ObjectNamesApi {
    getConfigSettings() {
        return Settings_1.Settings.GetConfigSettings(null);
    }
    GetObjectFileName(objectType, objectId, objectName) {
        let navObject = new NAVObject_1.NAVObject('', this.getConfigSettings(), '');
        navObject.setObjectProperies(objectType, objectId, objectName);
        return navObject.objectFileNameFixed;
    }
    GetObjectExtensionFileName(objectType, objectId, objectName, extendedObjectId, extendedObjectName) {
        let navObject = new NAVObject_1.NAVObject('', this.getConfigSettings(), '');
        navObject.setObjectExtensionProperies(objectType, objectId, objectName, extendedObjectId, extendedObjectName);
        return navObject.objectFileNameFixed;
    }
    GetObjectExtensionName(objectType, objectId, objectName, extendedObjectId, extendedObjectName) {
        let navObject = new NAVObject_1.NAVObject('', this.getConfigSettings(), '');
        navObject.setObjectExtensionProperies(objectType, objectId, objectName, extendedObjectId, extendedObjectName);
        return navObject.objectNameFixed;
    }
    GetBestPracticeAbbreviatedObjectType(ObjectType) {
        return DynamicsNAV_1.DynamicsNAV.getBestPracticeAbbreviatedObjectType(ObjectType);
    }
}
exports.ObjectNamesApi = ObjectNamesApi;
//# sourceMappingURL=ObjectNamesApi.js.map