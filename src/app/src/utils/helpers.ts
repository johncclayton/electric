import * as _ from "lodash";

export function celciusToF(c) {
    return c * 9 / 5 + 32;
}

export function objectHasBeenModified(original, current): boolean {
    // If there are changes, we should prompt the user to save.
    let modifiedProperties = _.reduce(original, function (result, value, key) {
        return _.isEqual(value, current[key]) ?
            result : result.concat(key);
    }, []);

    let are_equal = modifiedProperties.length == 0;
    return !are_equal;
}
