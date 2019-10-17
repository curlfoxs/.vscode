"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Mixpanel class
 * @author Ritesh Patel
 */
const vscode = require("vscode");
const Util_1 = require("./Util");
const Constants_1 = require("./Constants");
const { window, workspace } = vscode;
const rootPath = workspace.rootPath;
const fetch = require('node-fetch');
// mixpanel setup
const Mixpanel = require('mixpanel');
let mixpanel = Mixpanel.init('b2f0768e3da391eec05a786489971641');
let util = new Util_1.default();
let ipAddress = null;
// default class    
class PluginMixPanel {
    /**
     * @constructor
     * Create a unique guid (if none present). Retrieves plugin, sencha cmd and tern versions.
     */
    constructor(isContext = false) {
        this.trackingObj = {};
        this.isContext = false;
        // check and create a guid if required
        if (!util.checkIfGuidExist()) {
            util.createGuid();
        }
        // setup mix panel config object
        let mixpanelParams = util.getMixPanelParams();
        if (mixpanelParams.guid && mixpanelParams.consent) {
            this.userGuid = mixpanelParams.guid;
            this.userConsent = mixpanelParams.consent;
        }
        // get plugin & cmd versions
        this.versions = util.getVersions();
        this.pluginVersion = this.versions.pluginVersion;
        this.cmdVersion = this.versions.cmdVersion;
        // palette or menu context
        this.isContext = isContext;
        this.executedUsing = this.isContext ? "context menu" : "command palette";
        // default object for mix panel tracking
        this.trackingObj = {
            distinct_id: this.userGuid,
            pluginVersion: this.pluginVersion,
            cmdVersion: this.cmdVersion,
            executedUsing: this.executedUsing
        };
    }
    /**
     * Fetches the user's ip address from ipify
     */
    fetchIp() {
        return __awaiter(this, void 0, void 0, function* () {
            if (ipAddress)
                return ipAddress;
            try {
                const res = yield fetch('https://api.ipify.org?format=json');
                const json = yield res.json();
                return ipAddress = this.trackingObj.ip = json.ip;
            }
            catch (e) {
                // we do this to prevent trying to fetch the ip address repeatedly if ipify is blocked by the user's firewall
                return ipAddress = "0";
            }
        });
    }
    /**
     * Wrapper function for tracking mixpanel messages. Only sends messages if user has concurred to send anonymous stats.
     * @param {string} eventType - event type (one of the actions defined in the Constants class)
     * @param {JSON} params - {type : classType || packageType || appType}
     */
    sendTracker(eventType, params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasUserAgreed()) {
                yield this.fetchIp();
                switch (eventType) {
                    case Constants_1.default.START_APPWATCH:
                        this.trackAppWatch('start');
                        break;
                    case Constants_1.default.STOP_APPWATCH:
                        this.trackAppWatch('stop');
                        break;
                    case Constants_1.default.CREATE_APP:
                        this.trackCreateApp(params.toolkit);
                        break;
                    case Constants_1.default.CREATE_WORKSPACE:
                        this.trackCreateWorkspace();
                        break;
                    case Constants_1.default.CREATE_PACKAGE:
                        this.trackCreatePackage(params.type);
                        break;
                    case Constants_1.default.CREATE_CLASS:
                        this.trackCreateClass(params.type);
                        break;
                    case Constants_1.default.VIEW_CONFIG:
                        this.trackOpenConfig();
                        break;
                    case Constants_1.default.PLUGIN_LAUNCH:
                        this.trackPluginLaunch();
                        break;
                    case Constants_1.default.VIEW_DOCUMENTATION:
                        this.trackViewDocumentation();
                        break;
                }
            }
        });
    }
    /**
     * Tracks plugin launch. Upon launch sends a message to mixpanel with plugin, sencha cmd and tern versions
     */
    trackPluginLaunch() {
        mixpanel.track('vscode plugin : launched', this.trackingObj);
    }
    /**
     * Tracks when the user jumps to the api docs using the plugin
     */
    trackViewDocumentation() {
        mixpanel.track('view_documentation', this.trackingObj);
    }
    /**
     * Tracks app creation through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     * @param {string} appType - new app type (classic, modern or universal)
     */
    trackCreateApp(appType) {
        mixpanel.track(appType + ' app created : ' + this.executedUsing, Object.assign({ appType }, this.trackingObj));
    }
    /**
     * Tracks class creation through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     * @param {string} classType - new class type (view, view model, view controller, controller, store, model, class)
     */
    trackCreateClass(classType) {
        mixpanel.track(classType + ' created : ' + this.executedUsing, Object.assign({ classType }, this.trackingObj));
    }
    /**
     * Tracks workspace creation through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     */
    trackCreateWorkspace() {
        mixpanel.track('workspace created : ' + this.executedUsing, this.trackingObj);
    }
    /**
     * Tracks package creation through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     */
    trackCreatePackage(packageType) {
        mixpanel.track(packageType + ' package created : ' + this.executedUsing, Object.assign({ packageType }, this.trackingObj));
    }
    /**
     * Tracks view config through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     */
    trackOpenConfig() {
        mixpanel.track('config opened : ' + this.executedUsing, this.trackingObj);
    }
    /**
     * Tracks workspace creation through context menus or a command palette
     * @param {boolean} isContext - true (context menu)
     * @param {string} commandType - start or stop app watch
     */
    trackAppWatch(commandType) {
        mixpanel.track('app watch (' + commandType + ') : ' + this.executedUsing, Object.assign({ commandType }, this.trackingObj));
    }
    /**
     * Checks whether user has agreed to send anonymous stats
     * @returns {boolean} true | false
     */
    hasUserAgreed() {
        return this.userConsent === 'yes' ? true : false;
    }
    /**
     * Retrieves user consent
     * @returns {string} userConcent - user consent
     */
    getUserConsent() {
        return this.userConsent;
    }
    /**
     * Sets user consent, persist consent and tracks a plugin launch. Only gets called if user has never answered to the consent.
     * @param {string} consent - user consent
     */
    setUserConsent(consent) {
        this.userConsent = consent;
        util.persistConsent(consent);
        this.trackPluginLaunch();
    }
    /**
     * Handles default consent. (i.e. user has never answered the consent prompt)
     */
    handleDefaultConsent() {
        // asks user for a consent (only executed once)
        if (this.getUserConsent() === 'default') {
            const yesBtn = { title: 'YES' };
            const noBtn = { title: 'NO', isCloseAffordance: true };
            // consent handler
            const consentHandler = (consent) => {
                switch (consent.title) {
                    case yesBtn.title:
                        this.setUserConsent('yes');
                        break;
                    case noBtn.title:
                        this.setUserConsent('no');
                        break;
                }
            };
            vscode.window.showInformationMessage('Will you allow Sencha to collect anonymous stats about to your usage of the Ext JS extension?', yesBtn, noBtn).then(consentHandler);
        }
    }
}
exports.default = PluginMixPanel;
//# sourceMappingURL=PluginMixPanel.js.map