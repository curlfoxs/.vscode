/**
 * Function to stop app watch
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
    pluginMixPanel.sendTracker(Constants_1.default.STOP_APPWATCH);
    AppWatch_1.default.stop();
}
exports.default = default_1;
//# sourceMappingURL=stopAppWatch.js.map