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

export function compareTwoMaps(new_data, old_data) {
    let result = [];

    return _.reduce(new_data, (result, value, key) => {
        if (old_data.hasOwnProperty(key)) {
            if (_.isEqual(value, old_data[key])) {
                return result;
            } else {
                if (typeof (new_data[key]) != typeof ({}) || typeof (old_data[key]) != typeof ({})) {
                    //dead end.
                    result.push(key);
                    return result;
                } else {
                    let deeper = compareTwoMaps(new_data[key], old_data[key]);
                    return result.concat(_.map(deeper, (sub_path) => {
                        return key + "." + sub_path;
                    }));
                }
            }
        } else {
            result.push(key);
            return result;
        }
    }, result);
}
