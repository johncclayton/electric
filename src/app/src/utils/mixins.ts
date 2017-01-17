export class Chemistry {
    public chemistryClass(preset): string {
        return "chemistry-" + preset['type_str'];
    }
}

// Turns out not needed, since Rxjs has this anyway
//
// function applyMixins(derivedCtor: any, baseCtors: any[]) {
//     baseCtors.forEach(baseCtor => {
//         Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
//             derivedCtor.prototype[name] = baseCtor.prototype[name];
//         });
//     });
// }