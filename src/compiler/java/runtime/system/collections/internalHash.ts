/**
 * The hash a map or set files a key under.
 *
 * Boxed values hash through `__internalHashCode`, but the runtime's primitive
 * strings, numbers and booleans are raw JavaScript values with no methods.
 * They hash to themselves - the same hash their boxed forms (String, Number,
 * Boolean, Character) return - so a boxed key and the same key as a
 * primitive land in the same place, whichever way it was passed in.
 */
export function internalHash(key: any): any {
    if (key == null) return null;
    return typeof key.__internalHashCode === "function" ? key.__internalHashCode() : key;
}
