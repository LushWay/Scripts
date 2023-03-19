import { Player } from "@minecraft/server";
import { Database } from "../Database/Rubedo.js";
/**
 * @typedef {Record<string, { desc: string; value: T }>} DefaultConfig
 * @template [T = boolean | string | number]
 */
/**
 * TS doesn't converting true and false to boolean
 * @typedef {T extends true | false ? boolean : T} Normalize
 * @template T
 */
/** @type {Record<string, DefaultConfig<boolean>>} */
export const AllPlayerOptions = {};
/** @type {Record<string, DefaultConfig>} */
export const AllOptions = {};
/**
 * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
 * stored in a database
 * @template {DefaultConfig<boolean>} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - This is an object that contains the default values for each option.
 * @returns {(player: import("@minecraft/server").Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XPlayerOptions(prefix, CONFIG) {
    if (!(prefix in AllPlayerOptions))
        AllPlayerOptions[prefix] = CONFIG;
    // @ts-expect-error Trust me, TS
    return (player) => generateOptionsProxy(prefix, CONFIG, player);
}
/**
 * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
 * configuration object's properties in localStorage
 * @template {DefaultConfig} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - The default values for the options.
 * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XOptions(prefix, CONFIG) {
    if (!(prefix in AllOptions))
        AllOptions[prefix] = CONFIG;
    // @ts-expect-error Trust me, TS
    return generateOptionsProxy(prefix, CONFIG);
}
/**
 * It creates a proxy object that allows you to access and modify the values of a given object, but the
 * values are stored in a database
 * @param {string} prefix - The prefix for the database.
 * @param {DefaultConfig} CONFIG - This is the default configuration object. It's an object with the keys being the
 * option names and the values being the default values.
 * @param {Player} [player] - The player object.
 * @returns {Record<string, any>} An object with getters and setters
 */
function generateOptionsProxy(prefix, CONFIG, player = null) {
    /** @type {Database<string, string | boolean | number>} */
    const DB = new Database(prefix);
    const OptionsProxy = {};
    for (const prop in CONFIG) {
        const key = player ? player.id + ":" + prop : prop;
        Object.defineProperty(OptionsProxy, prop, {
            configurable: false,
            enumerable: true,
            get() {
                return DB.get(key) ?? CONFIG[prop].value;
            },
            set(v) {
                DB.set(key, v);
            },
        });
    }
    return OptionsProxy;
}
