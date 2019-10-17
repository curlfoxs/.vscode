/**
 * Function for starting app watch with fashion
 * @author Ritesh Patel
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const AppWatch_1 = require("./AppWatch");
const PluginMixPanel_1 = require("./PluginMixPanel");
const Constants_1 = require("./Constants");
/**
 * Default function
 * @param {ExtensionContext} context - right click context
 */
function default_1(context) {
    let isContext = context ? true : false;
    // mix panel tracking
    let pluginMixPanel = new PluginMixPanel_1.default(isContext);
    pluginMixPanel.sendTracker(Constants_1.default.START_APPWATCH);
    AppWatch_1.default.start(context, true);
}
exports.default = default_1;
//# sourceMappingURL=fashionAppWatch.js.map