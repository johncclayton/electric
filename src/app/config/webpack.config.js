// This comes from
// https://github.com/gshigeto/ionic-environment-variables

var chalk = require("chalk");
var fs = require('fs');
var path = require('path');
var useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');

var env = process.env.IONIC_ENV;
// console.log("env is", env);

if (env === 'prod' || env === 'dev') {
    var resolved_path = path.resolve(environmentPath());
    // console.log("Using environment: " + resolved_path);
    useDefaultConfig[env].resolve.alias = {
        "@app/env": resolved_path
    };
} else {
    // Default to dev config
    useDefaultConfig[env] = useDefaultConfig.dev;
    useDefaultConfig[env].resolve.alias = {
        "@app/env": path.resolve(environmentPath())
    };
}

function environmentPath() {
    var filePath = './src/environments/environment' + (env === 'prod' ? '' : '.' + env) + '.ts';
    if (!fs.existsSync(filePath)) {
        console.log(chalk.red('\n' + filePath + ' does not exist!'));
    } else {
        return filePath;
    }
}

module.exports = function () {
    return useDefaultConfig;
};