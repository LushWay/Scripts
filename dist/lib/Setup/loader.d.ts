/**
 * Runs function when first player was found by scrpits. Automatically catches any error Uses "testfor" and runCommandAsync underhood.
 * @param {Function} callback
 * @returns {Promise<void>}
 */
export function onWorldLoad(callback: Function): Promise<void>;
export namespace onWorldLoad {
    export { ON_LOAD_PROMISE as promise };
    export { ON_LOAD_CALLBACKS as callbacks };
}
declare var ON_LOAD_PROMISE: Promise<any>;
/** @type {Function[]} */
declare var ON_LOAD_CALLBACKS: Function[];
export {};
