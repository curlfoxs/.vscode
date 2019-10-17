const path = require('path');
const Manager = require('orion-core/lib/license/Manager');
const License = require('orion-core/lib/license/License');
const versionInfo = path.join(__dirname, '..', '..', 'version.properties');
console.log('version information ', versionInfo);
class VSCodeManager extends Manager {
    static get meta() {
        return {
            prototype: {
                versionInfo,
                products: [{
                        code: 'vsc',
                        name: 'Visual Studio Code Extension'
                    }]
            }
        };
    }
    load() {
        this._licenses = this._licenses.filter(l => !l.signature);
        super['load']();
    }
    getProductLicenses() {
        return super['getProductLicenses']('vsc');
    }
    verify() {
        return super['verify']();
    }
    createLicense(data) {
        const license = new License(Object.assign({}, data, { product: this.getProduct(data) }));
        license.manager = this;
        return license;
    }
}
module.exports = VSCodeManager;
//# sourceMappingURL=VSCodeManager.js.map