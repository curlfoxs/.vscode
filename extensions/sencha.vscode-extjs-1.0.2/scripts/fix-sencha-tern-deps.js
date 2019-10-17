const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join('node_modules', 'sencha-tern', 'package.json');
const copyToDependencies = [
    "chai", "chai-things", "codemirror", "glob", "gulp", 
    "mocha-teamcity-reporter", "request", "sentence-tokenizer"
];

const ternPackageJsonStr = fs.readFileSync(packageJsonPath, 'utf-8');
const ternPackageJson = JSON.parse(ternPackageJsonStr);

copyToDependencies.forEach(dep => { ternPackageJson.dependencies[dep] = ternPackageJson.devDependencies[dep]; });

fs.writeFileSync(packageJsonPath, JSON.stringify(ternPackageJson, null, 2), 'utf-8');