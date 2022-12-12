/**
 * It takes a prefix and a configuration object, and returns a proxy that uses the prefix to store the
 * configuration object's properties in localStorage
 * @param prefix - The prefix for the database.
 * @param CONFIG - The default values for the options.
 * @returns An object with properties that are getters and setters.
 */
export function XOptions<Config extends DefaultConfig>(
	prefix: string,
	CONFIG: Config
): { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> };

/**
 * It creates a proxy object that has the same properties as the `CONFIG` object, but the values are
 * stored in a database
 * @param player - The player whose options you want to get/set.
 * @param prefix - The prefix for the database.
 * @param CONFIG - This is an object that contains the default values for each option.
 * @returns An object with properties that are getters and setters.
 */
export function XPlayerOptions<Config extends DefaultConfig<boolean>>(
	prefix: string,
	CONFIG: Config
): (player: import("@minecraft/server").Player) => { [Prop in keyof Config]: Normalize<Config[Prop]["value"]> };

export const AllPlayerOptions: Record<string, DefaultConfig<boolean>> = {};

export const AllOptions: Record<string, DefaultConfig> = {};

type DefaultConfig<T = boolean | string | number> = Record<string, { desc: string; value: T }>;

/** TS doesnt converting true and false to boolean, so we need to manually convert them */
type Normalize<T> = T extends true | false ? boolean : T;

export const wo = {};
