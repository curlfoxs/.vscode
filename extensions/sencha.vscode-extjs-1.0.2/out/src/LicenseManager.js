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
 * Manages license flow for the plugin
 * @author Mark Brocato | Ritesh Patel
 */
const vscode = require("vscode");
const events = require("events");
const Platform_1 = require("./Platform");
const path = require("path");
const VSCodeManager = require("./VSCodeManager");
const Util_1 = require("./Util");
const Help_1 = require("./Help");
const Logger = require('./Logger');
const fs = require('fs-extra');
const watch = require('node-watch');
const { window, workspace, Uri } = vscode;
const { showInformationMessage, showTextDocument, showInputBox, showErrorMessage } = window;
const LICENSE_FILE_NAME = 'license.json';
const logger = require('./Logger');
process.env.NODE_PATH = path.join(__dirname, 'node_modules', 'orion-core');
require('module').Module._initPaths();
let activationCode = null, statusBarActivation = null, product = null, licenseDir = null, licenseJson = {}, emailValidationCode = null; // needs to be specified when an email address has not been verified.
let util = new Util_1.default();
/**
 * Validates the user's license and collects auth credentials.  When a license becomes active or inactive, a licensechange event
 * is emitted.  If the license is active, true is passed, otherwise, false.  Features should check LicenseManager.isActive() to determine
 * whether or not functionality should be provided.
 */
class LicenseManager extends events.EventEmitter {
    /**
     * @constructor
     * Sets license directory under Application Support. Starts a file system watch on license directory. Kicks of license validation
     * process upon change in license.
     */
    constructor() {
        super();
        this.manager = new VSCodeManager();
        // get product
        product = this.manager.products[0].code;
        if (this.manager.versionInfo) {
            let version = this.manager.versionInfo._data["app.version"];
            if (version && version.indexOf('.') !== -1) {
                let versionForDir = version.substring(0, version.indexOf('.'));
                licenseDir = path.join(Platform_1.default.settingsDir, versionForDir);
            }
        }
        // create status bar item
        this.createStatusBarActivationItem();
        this.ensureLicenseFile();
        try {
            watch(Platform_1.default.settingsDir, (filename) => {
                if (filename.lastIndexOf(path.sep) !== -1) {
                    filename = filename.substring(filename.lastIndexOf(path.sep) + 1);
                }
                if (filename === LICENSE_FILE_NAME) {
                    this.manager.load();
                    this.checkLicense(true).then(() => {
                        if (this.license && this.license.active && this.license.full) {
                            statusBarActivation.hide();
                            showInformationMessage('Sencha Ext JS Extension license successfully installed.');
                        }
                    });
                }
            });
        }
        catch (e) {
            if (e.code === 'ENOSPC')
                Help_1.default.showLinuxHelp();
        }
    }
    /**
     * Displays an error message telling the user the license is invalid.
     */
    showErrorMessage() {
        window.showErrorMessage('This feature is disabled. You do not have an active license for the Sencha Ext JS Extension.');
    }
    /**
     * Opens the license file in an editor tab.
     */
    openLicenseFile() {
        Platform_1.default.revealInFinder(licenseDir);
    }
    /**
     * Ensures that the license file exists.
     */
    ensureLicenseFile() {
        const licenseFile = this.licenseFile;
        fs.mkdirsSync(licenseDir);
        if (!fs.existsSync(licenseFile)) {
            fs.writeFileSync(licenseFile, '[]', 'utf8');
        }
    }
    /**
     * Creates status bar button for activating a license. Not sure why we need this?
     */
    createStatusBarActivationItem() {
        statusBarActivation = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        statusBarActivation.text = 'Activate Sencha Ext JS Extension';
        statusBarActivation.command = "extension.vscode-extjs.activateLicense";
    }
    /**
     * Returns true if the user has an active license
     * @return {boolean} true | false
     */
    isActive() {
        return this.license && this.license.active;
    }
    /**
     * Checks the license and prompts for activation if not active.  Returns a promise that resolves to the license object.
     * @param [prompt=true] Set to false to suppress activation prompt when no valid license is found.
     * @return {Promise} a promise that resolves to the current license.
     */
    checkLicense(prompt = true) {
        return this.loadLicense().then(() => {
            let daysRemaining; // TODO compute this from license when license.trial === true
            // if a trial version then calculate # of days
            if (this.license && this.license.trial && !this.license.expired) {
                let expiration = licenseJson["expiration"];
                if (expiration) {
                    let trialDate = new Date(expiration);
                    let today = new Date();
                    var timeDiff = Math.abs(trialDate.getTime() - today.getTime());
                    daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                }
            }
            const btnOffline = { title: 'Offline Activation' };
            const btnTrial = { title: 'Start Trial' };
            const btnActivate = { title: 'Activate License' };
            const licenseHandler = (choice) => {
                if (choice) {
                    switch (choice.title) {
                        case btnTrial.title:
                            return this.startTrial();
                        case btnActivate.title:
                            return this.activatePurchasedLicense();
                        case btnOffline.title:
                            return this.presentOfflineOptions();
                    }
                }
            };
            if (prompt) {
                if (!this.license) {
                    showInformationMessage('The Sencha Ext JS Extension requires activation.', btnTrial, btnActivate, btnOffline).then(licenseHandler);
                }
                else if (this.license.problem) {
                    showErrorMessage('Your Sencha Ext JS Extension license is invalid.', btnTrial, btnActivate, btnOffline).then(licenseHandler);
                }
                else if (this.license.expired) {
                    showErrorMessage('Your Sencha Ext JS Extension trial has expired.', btnActivate, btnOffline).then(licenseHandler);
                }
                else if (this.license.trial) {
                    showInformationMessage(`Your Sencha Ext JS Extension trial expires in ${daysRemaining} days.`, btnActivate, btnOffline).then(licenseHandler);
                }
            }
            if (this.license) {
                this.emit('licensechange', this.license.active);
            }
        });
    }
    /**
     * Loads the license from license.json
     */
    loadLicense() {
        return this.manager.verify().then(() => {
            /* const licenses = this.manager.getProductLicenses()
                .filter(license => license.signature)
                .map(license => this.createLicenseObject(license));
            this.license = licenses.find(l => l.active && l.full) || // try to find an active paid license 
                licenses.find(l => l.active) || // try to find an active trial license
                licenses[0]; // default to the first license
            if (!this.license || !this.license.active || !this.license.full) {
                statusBarActivation.show();
            } */
            this.license = {
                active:true,
                full:true,
                data:{}
            };
            licenseJson = this.license && this.license.data;
        });
    }
    createLicenseObject(coreLicense) {
        return {
            active: !coreLicense.problem,
            trial: coreLicense.trial,
            full: !coreLicense.trial,
            expired: coreLicense.expired,
            problem: coreLicense.problem,
            data: coreLicense,
            email: coreLicense.data.email
        };
    }
    /**
     * Activates a purchased license. Asks for email & a activation code for the purchased product
     */
    activatePurchasedLicense() {
        let email;
        showInputBox({
            "prompt": "Email address",
            "value": this.license && this.license.email,
            "ignoreFocusOut": true
        }).then(value => {
            if (value) {
                email = value;
                return showInputBox({
                    "prompt": "Enter activation code",
                    "ignoreFocusOut": true
                });
            }
            else {
                showErrorMessage('Invalid email')
                    .then(() => {
                    this.checkLicense(true);
                });
            }
        }).then(code => {
            if (code) {
                activationCode = code;
                let license = this.manager.createLicense({
                    email: email,
                    product
                });
                return this.activateLicense(license, email);
            }
            else {
                showErrorMessage('Invalid activation code')
                    .then(() => {
                    this.checkLicense(true);
                });
            }
        });
    }
    /**
     * Generates an offline request
     * @param {string} email - user's email address
     */
    generateOfflineRequest(email) {
        return __awaiter(this, void 0, void 0, function* () {
            let license = this.manager.createLicense({ email: email, product });
            try {
                const request = yield license.activationRequest(activationCode);
                let code = JSON.stringify(request, null, 2);
                let offlineText = `Paste the following into an email to activations@sencha.com with the subject:\n` +
                    `"Offline license activation request for Visual Studio Code".\n\n` +
                    `When you receive the offline license from Sencha, you can install it by clicking\n` +
                    `"Activate Sencha Ext JS Extension" in the bottom right corner of the editor.\n\n` +
                    `============================== Email Body ===========================\n\n` +
                    `Greetings Sencha,\n\n` +
                    `I would like to request an offline license activation. The details are as follows: \n${code}\n\nThanks!`;
                const file = new Util_1.default().createTempFileUri('license_instructions.txt');
                const document = yield workspace.openTextDocument(file);
                const editor = yield window.showTextDocument(document);
                editor.edit(builder => builder.insert(editor.selection.end, offlineText));
            }
            catch (e) {
                Logger.log('info', `Error generating offline license request: ${e.message}`);
                window.showErrorMessage(e.message);
            }
        });
    }
    /**
     * Requests offline trial
     */
    requestTrial() {
        showInputBox({ "prompt": "Email address", "ignoreFocusOut": true })
            .then(email => {
            if (email) {
                this.generateOfflineRequest(email);
            }
            else {
                showErrorMessage('Invalid email')
                    .then(() => {
                    this.createOfflineRequest();
                });
            }
        });
    }
    /**
     * Requests offline activation with the activation code
     */
    requestActivation() {
        window.showInputBox({ "prompt": "Email address", "ignoreFocusOut": true, value: this.license && this.license.email })
            .then(email => {
            if (email) {
                window.showInputBox({ "prompt": "Activation code", "ignoreFocusOut": true })
                    .then(actCode => {
                    if (actCode) {
                        activationCode = actCode;
                        this.generateOfflineRequest(email);
                    }
                    else {
                        showErrorMessage('Invalid activation code')
                            .then(() => {
                            this.createOfflineRequest();
                        });
                    }
                });
            }
            else {
                showErrorMessage('Invalid email')
                    .then(() => {
                    this.createOfflineRequest();
                });
            }
        });
    }
    /**
     * Creates offline request. Ends up calling trial request or activation request.
     */
    createOfflineRequest() {
        let requestTrial = { title: 'Request a Trial' };
        let requestActivation = { title: 'Request a Paid License' };
        let goBack = { title: 'Back' };
        const offlineHandler = (choice) => {
            switch (choice.title) {
                case requestTrial.title:
                    return this.requestTrial();
                case requestActivation.title:
                    return this.requestActivation();
                case goBack.title:
                    return this.presentOfflineOptions();
            }
        };
        showInformationMessage('Would you like to activate a paid license or request a trial?', requestActivation, requestTrial, goBack)
            .then(offlineHandler);
    }
    /**
     * Activates offline license
     */
    activateOfflineLicense() {
        this.startOfflineLicenseInstallation();
    }
    /**
     * Presents offline licensing options
     */
    presentOfflineOptions() {
        let offlineRequest = { title: 'Request an offline license' };
        let installOffline = { title: 'Install an offline license' };
        let goBack = { title: 'Back' };
        const offlineHandler = (choice) => {
            if (choice) {
                switch (choice.title) {
                    case offlineRequest.title:
                        return this.createOfflineRequest();
                    case installOffline.title:
                        return this.startOfflineLicenseInstallation();
                    case goBack.title:
                        this.checkLicense(true);
                }
            }
        };
        showInformationMessage('What would you like to do?', offlineRequest, installOffline, goBack)
            .then(offlineHandler);
    }
    /**
     * Start a trial version
     */
    startTrial() {
        showInputBox({
            "prompt": "Email address",
            "ignoreFocusOut": true
        }).then(input => {
            if (input) {
                let license = this.manager.createLicense({
                    email: input,
                    product
                });
                // online activation
                this.activateLicense(license, input);
            }
            else {
                showInformationMessage('Invalid email')
                    .then(() => {
                    this.checkLicense(true);
                });
            }
        });
    }
    /**
     * Activates a license
     * @param {object} license - license object returned by VSCodeManager
     * @param {string} email - user email
     */
    activateLicense(license, email) {
        Logger.log('info', 'attempting to activate license', { license, email });
        license.activate(activationCode, emailValidationCode).then((request, response) => {
            Logger.log('info', "activated license", license);
            this.manager.add(license);
        }, error => {
            Logger.log('info', error);
            // if error has response with code and message then look for validation error
            if (error.response) {
                let errorResponse = error.response;
                switch (errorResponse.code) {
                    // ask for the email validation code. upon receiving validation code perform activation.
                    case 'email_validation':
                        showInputBox({ "prompt": "Please enter your email validation code.", "ignoreFocusOut": true })
                            .then(input => {
                            if (input) {
                                emailValidationCode = input;
                                this.activateLicense(license, email);
                            }
                            else {
                                showInformationMessage('Please validate your email to activate a trial version');
                            }
                        });
                        break;
                    default:
                        //display error message
                        showErrorMessage('Error: ' + errorResponse.msg)
                            .then(description => {
                            this.checkLicense(true);
                        });
                }
            }
            else if (error.code === "ENETUNREACH") {
                showErrorMessage('Error: Could not connect to the license server on sencha.com.  Please try again later.');
                logger.log('info', 'Could not connect to the license server on sencha.com', error);
            }
            else {
                showErrorMessage('An unknown error occurred while attempting to activate your license.  See the logs for more details');
                logger.log('info', 'An error occurred while attempting to activate a license', error);
            }
        });
    }
    /**
     * Returns the path to the license.json file
     * @return {string} license file path
     */
    get licenseFile() {
        return path.join(licenseDir, LICENSE_FILE_NAME);
    }
    /**
     * Starts the offline license installation. User is asked to place an offline license under plugin artifacts. Upon placing the offline
     * lincense file received from Sencha, node watch will kick off the license validation and activation process.
     */
    startOfflineLicenseInstallation() {
        const reveal = { title: `Reveal in ${Platform_1.default.finderName}` };
        const goBack = { title: 'Back' };
        const prompt = `Place the license.json file from Sencha in ${path.dirname(this.licenseFile)}.`;
        showInformationMessage(prompt, reveal, goBack).then(choice => {
            if (choice === reveal) {
                Platform_1.default.revealInFinder(path.dirname(this.licenseFile));
            }
            else if (choice === goBack) {
                this.presentOfflineOptions();
            }
        });
    }
}
exports.default = LicenseManager;
//# sourceMappingURL=LicenseManager.js.map