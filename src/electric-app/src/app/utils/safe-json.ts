const stringifySafe = require('json-stringify-safe');

class SWBSafeJSON {
    public static stringify(thing: any) {
        if (thing === undefined) {
            return 'undefined';
        }

        if(typeof thing === 'string') {
            return thing;
        }

        return stringifySafe(thing);
    }
}

export {
    SWBSafeJSON
}
