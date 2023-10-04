import { Player, system, world } from "@minecraft/server";
import { util } from "../util.js";
import { DB, DatabaseError } from "./Default.js";

/**
 * @template {string} [Key = string]
 * @template [Value=undefined]
 */
export class WorldDynamicPropertiesKey {
	/**
	 * @private
	 * @type {Record<any, any>}
	 */
	value = {};

	/**
	 *
	 * @param {string} key
	 * @param {{defaultValue?: WorldDynamicPropertiesKey<Key, Value>["defaultValue"]}} [options]
	 */
	constructor(key, options = {}) {
		if (key in WorldDynamicPropertiesKey.keys) {
			const source = WorldDynamicPropertiesKey.keys[key];
			return options?.defaultValue
				? Object.setPrototypeOf(
						{
							defaultValue: options.defaultValue,
						},
						source,
				  )
				: source;
		}

		/** @type {string} */
		this.key = key;
		if (options.defaultValue) this.defaultValue = options.defaultValue;
		WorldDynamicPropertiesKey.keys[key] = this;

		this.init();
	}
	initTries = 0;
	init() {
		this.initTries++;
		// Init
		try {
			const value = world.getDynamicProperty(this.key) ?? "{}";
			if (typeof value !== "string") {
				throw new DatabaseError(
					`Unexpected type for key '${this.key}': ${typeof value}`,
				);
			}
			this.value = JSON.parse(value);
		} catch (error) {
			if (
				error &&
				error.message &&
				error.message.startsWith("Dynamic property") &&
				this.initTries < 2
			) {
				return system.runTimeout(
					() => {
						this.init();
					},
					"dyn reinit",
					10,
				);
			}
			util.error(
				new DatabaseError(`Failed to parse init key '${this.key}': ${error}`),
			);
		}
	}
	/**
	 *
	 * @returns {Record<string, Value>}
	 */
	proxy() {
		return this.subproxy(this.value, "", "", true);
	}

	_needSave = false;
	needSave() {
		console.log("save requested for " + this.key);
		if (!this._needSave)
			system.run(() =>
				util.catch(() => {
					world.setDynamicProperty(this.key, JSON.stringify(this.value));
					this._needSave = false;
				}, "PropertySave"),
			);
	}

	/**
	 *
	 * @private
	 * @param {string} p
	 * @returns {NonNullable<Value> extends JSONLike ? Partial<Value> : never}
	 */
	defaultValue(p) {
		return {};
	}

	/**
	 *
	 * @param {Record<string, any>} object
	 * @param {string} key
	 * @param {string} keys
	 * @returns {Record<string, any>}
	 */
	subproxy(object, key, keys, initial = false) {
		const db = this;
		return new Proxy(object, {
			get(target, p, reciever) {
				const value = Reflect.get(target, p, reciever);
				if (typeof p === "symbol") return value;
				if (typeof value === "object")
					return db.subproxy(
						initial ? DB.setDefaults(value, db.defaultValue(p)) : value,
						p,
						initial ? db.key : keys + "." + key,
					);

				return value;
			},
			set(target, p, value, reciever) {
				if (typeof p === "symbol")
					return Reflect.set(target, p, value, reciever);
				// if (typeof value === "object") {
				// 	Object.defineProperties(
				// 		value,
				// 		Object.fromEntries(
				// 			Object.entries(Object.getOwnPropertyDescriptors(value))
				// 				.filter(([_, d]) => (d.writable || d.set) && d.configurable)
				// 				.map(([key, descriptor]) => {
				// 					console.log({ key, descriptor });
				// 					/** @type {any} */
				// 					let v1 = descriptor.value;
				// 					delete descriptor.value;
				// 					delete descriptor.writable;

				// 					const originalSet = descriptor.set?.bind(descriptor);
				// 					descriptor.set = (v2) => {
				// 						db.needSave();
				// 						originalSet ? originalSet(v2) : (v1 = v2);
				// 					};
				// 					if (descriptor.get) {
				// 						descriptor.get =
				// 							descriptor.get?.bind(descriptor) ?? (() => v1);
				// 					}

				// 					return [key, descriptor];
				// 				}),
				// 		),
				// 	);
				// }

				const setted = Reflect.set(
					target,
					p,
					initial ? DB.setDefaults(value, db.defaultValue(p)) : value,
					reciever,
				);
				if (setted) db.needSave();
				return setted;
			},
		});
	}

	/**
	 * @type {Record<string, WorldDynamicPropertiesKey<any, any>>}
	 */
	static keys = {};
}

Object.defineProperty(Player.prototype, "database", {
	enumerable: true,
	configurable: false,
	get() {},
});
