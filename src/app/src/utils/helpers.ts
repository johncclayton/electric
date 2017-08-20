import * as _ from "lodash";

export function celciusToF(c) {
    return c * 9 / 5 + 32;
}

export function propertiesThatHaveBeenModified(obj1, obj2): {} {
    let allkeys = _.union(_.keys(obj1), _.keys(obj2));
    return _.reduce(allkeys, function (result, key) {
        if (!_.isEqual(obj1[key], obj2[key])) {
            result[key] = {obj1: obj1[key], obj2: obj2[key]}
        }
        return result;
    }, {});
}
