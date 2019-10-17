'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Platform_1 = require("./Platform");
const Constants_1 = require("./Constants");
const path = require('path');
const fs = require('fs');
const cjson = require('cjson');
/**
 * Template utility class.
 * @author Ritesh Patel
 * @export
 * @class TemplateUtil
 */
class TemplateUtil {
    constructor() {
        this.templates = {
            "Ext JS Class": {
                "prefix": "extjs_class",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "   \n",
                    "});"
                ],
                "description": "Creates a new Ext JS class"
            },
            "Ext JS View": {
                "prefix": "extjs_view",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.Container',\n",
                    "    \n",
                    "    // Uncomment to give this component an xtype \n",
                    "    // xtype : '{aliasPrefix}-{xtype}', \n",
                    "    \n",
                    "    items: [\n",
                    "        /*  include child components here */\n",
                    "    ]\n",
                    "});"
                ],
                "description": "Creates a new Ext JS view"
            },
            "Ext JS Model": {
                "prefix": "extjs_model",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.data.Model',\n",
                    "    fields: [\n",
                    "            /*\n",
                    "            The fields for this model. This is an Array of Ext.data.field.Field definition objects or simply the field name.\n",
                    "            If just a name is given, the field type defaults to auto.  For example:\n",
                    "                { name: 'name',     type: 'string' },\n",
                    "                { name: 'age',      type: 'int' },\n",
                    "                { name: 'phone',    type: 'string' },\n",
                    "                { name: 'gender',   type: 'string' },\n",
                    "                { name: 'username', type: 'string' },\n",
                    "                { name: 'alive',    type: 'boolean', defaultValue: true }\n",
                    "            */\n",
                    "        ]\n",
                    "        /*\n",
                    "        Uncomment to add validation rules\n",
                    "            validators: {\n",
                    "            age: 'presence',\n",
                    "            name: { type: 'length', min: 2 },\n",
                    "            gender: { type: 'inclusion', list: ['Male', 'Female'] },\n",
                    "            username: [\n",
                    "            { type: 'exclusion', list: ['Admin', 'Operator'] },\n",
                    "            { type: 'format', matcher: /([a-z]+)[0-9]{2,3}/i }\n",
                    "            ]\n",
                    "            }\n",
                    "        */\n",
                    "        /*\n",
                    "        Uncomment to add a rest proxy that syncs data with the back end.\n",
                    "            proxy: {\n",
                    "            type: 'rest',\n",
                    "            url : '/users'\n",
                    "            }\n",
                    "        */\n",
                    "});"
                ],
                "description": "Creates a new Ext JS model"
            },
            "Ext JS Controller": {
                "prefix": "extjs_controller",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.app.Controller',\n",
                    "    config: {\n",
                    "        /*\n",
                    "            Uncomment to add references to view components\n",
                    "            refs: [{\n",
                    "                ref: 'list',\n",
                    "                selector: 'grid'\n",
                    "            }],\n",
                    "        */\n",
                    "        /*\n",
                    "            Uncomment to listen for events from view components\n",
                    "            control: {\n",
                    "                    'useredit button[action=save]': {\n",
                    "                    click: 'updateUser'\n",
                    "                }\n",
                    "            }\n",
                    "        */\n",
                    "    },\n",
                    "    /**\n",
                    "     * Called when the view is created\n",
                    "     */\n",
                    "    init: function () {}\n",
                    "});"
                ],
                "description": "Creates a new Ext JS controller"
            },
            "Ext JS ViewModel": {
                "prefix": "extjs_viewmodel",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.app.ViewModel',\n",
                    "    alias: 'viewmodel.{aliasPrefix}-{alias}',\n",
                    "    stores: {\n",
                    "        /*\n",
                    "        A declaration of Ext.data.Store configurations that are first processed as binds to produce an effective\n",
                    "        store configuration. For example:\n",
                    "        users: {\n",
                    "            model: 'User',\n",
                    "            autoLoad: true\n",
                    "        }\n",
                    "        */\n",
                    "    },\n",
                    "    data: {\n",
                    "        /* This object holds the arbitrary data that populates the ViewModel and is then available for binding. */\n",
                    "    }\n",
                    "});"
                ],
                "description": "Creates a new Ext JS view model"
            },
            "Ext JS ViewController": {
                "prefix": "extjs_viewcontroller",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.app.ViewController',\n",
                    "    alias: 'controller.{aliasPrefix}-{alias}',\n",
                    "    /**\n",
                    "     * Called when the view is created\n",
                    "     */\n",
                    "    init: function () {}\n",
                    "});"
                ],
                "description": "Creates a new Ext JS view controller"
            },
            "Ext JS Store": {
                "prefix": "extjs_store",
                "body": [
                    "Ext.define('{classname}', {\n",
                    "    extend: 'Ext.data.Store',\n",
                    "    /*\n",
                    "    Uncomment to use a specific model class\n",
                    "    model: 'User',\n",
                    "    */\n",
                    "    /*\n",
                    "    Fields can also be declared without a model class:\n",
                    "    fields: [\n",
                    "        {name: 'firstName', type: 'string'},\n",
                    "        {name: 'lastName',  type: 'string'},\n",
                    "        {name: 'age',       type: 'int'},\n",
                    "        {name: 'eyeColor',  type: 'string'}\n",
                    "    ]\n",
                    "    */\n",
                    "    /*\n",
                    "    Uncomment to specify data inline\n",
                    "    data : [\n",
                    "        {firstName: 'Ed',    lastName: 'Spencer'},\n",
                    "        {firstName: 'Tommy', lastName: 'Maintz'},\n",
                    "        {firstName: 'Aaron', lastName: 'Conran'}\n",
                    "    ]\n",
                    "    */\n",
                    "});"
                ],
                "description": "Creates a new Ext JS store"
            }
        };
    }
    /**
     * Creates templates json with class, view, model, store, viewmodel, viewcontroller and controller templates
     *
     *
     * @memberOf TemplateUtil
     */
    createTemplateJson() {
        let templateFile = path.join(Platform_1.default.settingsDir, Constants_1.default.TEMPLATE_FILE);
        // create templates file
        if (!fs.existsSync(templateFile)) {
            let data = "// Override default Ext JS snippets by providing new snippets for keys in the defaults file.\n" +
                "// You can also add new snippets.\n" +
                "{}";
            fs.writeFileSync(templateFile, data, 'utf8', (err) => {
                if (err) {
                    console.log('Error creating template file', err);
                }
            });
        }
    }
    /**
     * Reads templates json from file system
     *
     * @returns {Object} data - templates in a json format
     *
     * @memberOf TemplateUtil
     */
    loadTemplates() {
        let data;
        let templateFile = path.join(Platform_1.default.settingsDir, Constants_1.default.TEMPLATE_FILE);
        if (fs.existsSync(templateFile)) {
            data = cjson.load(templateFile);
        }
        return data || {};
    }
    /**
     * Extract template from the JSON, replace class path, xtype and alias if required.
     *
     * @param {string} templateType - template type (extjs_view, extjs_store and so on...)
     * @param {string} classPath - namespace returned by Tern
     * @returns {string} body - template body
     *
     * @memberOf TemplateUtil
     */
    getTemplate(templateType, classPath) {
        let className = classPath.substring(classPath.lastIndexOf('.') + 1);
        let templates = this.loadTemplates();
        for (let key in templates) {
            let template = templates[key];
            if (template.prefix === templateType) {
                let body = template.body.join(" ");
                body = body.replace('{classname}', classPath);
                if (body.indexOf('{xtype}') !== -1) {
                    body = body.replace('{xtype}', 'widget.' + className.toLowerCase());
                }
                if (body.indexOf('{alias}') !== -1) {
                    body = body.replace('{alias}', className.toLowerCase());
                }
                return body || "";
            }
        }
    }
    /**
     *
     * Retrieves templates
     * @returns {string} - templates
     *
     * @memberOf TemplateUtil
     */
    getTemplates() {
        return this.templates;
    }
}
exports.default = TemplateUtil;
//# sourceMappingURL=TemplateUtil.js.map