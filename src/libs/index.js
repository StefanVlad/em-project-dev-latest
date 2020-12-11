
var uString = require('underscore.string');

function changeKeysToCamel(json) {
    var output = {};

    for(var key in json) {
        if(Object.prototype.toString.apply(json[key]) === '[object Object]') {
            output[uString.camelize(key)] = changeKeysToCamel(json[key]);
        } else {
            output[uString.camelize(key)] = json[key];
        }
    }

    return output;
}

function interpolateString(str, varList) {
    varList = varList || {};

    for (var varName in varList) {
        str = str.replace("[" + varName + "]", varList[varName]);
    }
    return str;
}



module.exports = {
    changeKeysToCamel: changeKeysToCamel,
    interpolateString: interpolateString,
    $http: require('./$http')
};
