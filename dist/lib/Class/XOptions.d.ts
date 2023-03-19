/**
 * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
 * stored in a database
 * @template {DefaultConfig<boolean>} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - This is an object that contains the default values for each option.
 * @returns {(player: import("@minecraft/server").Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XPlayerOptions<Config extends DefaultConfig<boolean>>(prefix: string, CONFIG: Config): (player: import("@minecraft/server").Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]>; };
/**
 * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
 * configuration object's properties in localStorage
 * @template {DefaultConfig} Config
 * @param {string} prefix - The prefix for the database.
 * @param {Config} CONFIG - The default values for the options.
 * @returns {{ [Prop in keyof Config]: Normalize<Config[Prop]["value"]> }} An object with properties that are getters and setters.
 */
export function XOptions<Config extends DefaultConfig<string | number | boolean>>(prefix: string, CONFIG: Config): { [Prop in keyof Config]: Normalize<Config[Prop]["value"]>; };
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
export const AllPlayerOptions: Record<string, DefaultConfig<boolean>>;
/** @type {Record<string, DefaultConfig>} */
export const AllOptions: Record<string, DefaultConfig>;
export type DefaultConfig<T = string | number | boolean> = Record<string, {
    desc: string;
    value: T;
}>;
/**
 * TS doesn't converting true and false to boolean
 */
export type Normalize<T> = T extends true | false ? boolean : T;
