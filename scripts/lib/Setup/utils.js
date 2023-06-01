import { system } from "@minecraft/server";
import { errorMessageParse, stackParse } from "../Class/Error.js";

export const util = {
	/**
	 * Parse and show error in chat
	 * @param {{ message: string; stack?: string; name?: string} | string} err
	 * @param {object} [arg2]
	 * @param {number} [arg2.deleteStack]
	 * @param {string[]} [arg2.additionalStack]
	 * @param {string} [arg2.errorName]
	 */
	error(
		err,
		{ deleteStack = 0, additionalStack = [], errorName = "Error" } = {}
	) {
		if (typeof err === "string") {
			err = new Error(err);
			err.name = "CommandError";
		}
		const stack = stackParse(deleteStack + 1, additionalStack, err.stack);
		const message = errorMessageParse(err);
		const name = err?.name ?? errorName;
		const text = `§4${name}: §c${message}\n§f${stack}\n`;

		try {
			// if (onWorldLoad.loaded()) world.say(text);
			console.error(text);

			console.log(text);
		} catch (e) {}
	},

	/**
	 * @param {Object} target
	 */
	inspect(target, space = "  ", cw = "", funcCode = false, depth = 0) {
		const c = {
			function: {
				function: "§5",
				name: "§9",
				arguments: "§f",
				code: "§8",
				brackets: "§7",
			},

			nonstring: "§6",
			symbol: "§7",
			string: "§3",
		};

		const uniqueKey = Date.now().toString();

		if (depth > 10 || typeof target !== "object")
			return `${rep(target)}` ?? `${target}` ?? "{}";

		/**
		 * @param {any} value
		 */
		function rep(value) {
			switch (typeof value) {
				case "function":
					/**
					 * @type {string}
					 */
					let r = value.toString().replace(/[\n\r]/g, "");

					if (!funcCode) {
						const native = r.includes("[native code]");
						const code = native ? " [native code] " : "...";
						let isArrow = true;
						let name = "";

						if (r.startsWith("function")) {
							r = r.replace(/^function\s*/, "");
							isArrow = false;
						}

						if (/\w*\(/.test(r)) {
							name = r.match(/(\w*)\(/)[1];
							r = r.replace(name, "");
						}

						let args = "()",
							bracket = false,
							escape = false;

						for (const [i, char] of r.split("").entries()) {
							if (char === '"' && !escape) {
								bracket = !bracket;
							}

							if (char === "\\") {
								escape = true;
							} else escape = false;

							if (!bracket && char === ")") {
								args = r.substring(0, i);
								break;
							}
						}
						const cl = c.function;
						// function
						r = `${isArrow ? "" : `${cl.function}function `}`;
						// "name"
						r += `${cl.name}${name}`;
						// "(arg, arg)"
						r += `${cl.arguments}${args})`;
						// " => "  or  " "
						r += `${cl.function}${isArrow ? " => " : " "}`;
						// "{ code }"
						r += `${cl.brackets}{${cl.code}${code}${cl.brackets}}§r`;
					}

					value = r;

					break;

				case "object":
					if (Array.isArray(value)) break;

					if (visited.has(value)) {
						// Circular structure detected
						value = "{...}";
						break;
					}

					try {
						visited.add(value);
					} catch (e) {}

					/** @type {any} */
					const allInherits = {};

					for (const key in value)
						try {
							// value[key] can be ungettable
							allInherits[key] = value[key];
						} catch (e) {}

					value = allInherits;
					break;
				case "symbol":
					value = `${c.symbol}[Symbol.${value.description}]§r`;
					break;

				case "string":
					value = `${c.string}\`${value.replace(/"/g, uniqueKey)}\`§r`;
					break;

				default:
					value = c.nonstring + value + "§r";
					break;
			}
			return value;
		}

		// avoid Circular structure error
		const visited = new WeakSet();

		return JSON.stringify(target, (_, value) => rep(value), space)
			?.replace(/"/g, cw)
			?.replace(new RegExp(uniqueKey, "g"), '"');
	},

	/**
	 * Runs the given callback safly. If it throws any error it will be handled
	 * @param {Function | (() => void | Promise<any>)} func
	 * @param {string} [type]
	 * @param {string[]} [additionalStack]
	 */
	async handle(func, type = "Handled", additionalStack) {
		try {
			await func();
		} catch (e) {
			this.error(
				{
					message: `${e.name ? `${e.name}: §f` : ""}${e.message ?? e}`,
					name: type,
					stack: e?.stack,
				},
				{ additionalStack, deleteStack: 1 }
			);
		}
	},

	/**
	 *
	 * @param {number} C
	 */
	waitEach(C) {
		let count = 0;
		return async () => {
			count++;
			if (count % C === 0) {
				await system.sleep(1);
				return count;
			}
		};
	},

	/**
	 * @param {string | symbol | number} str
	 * @param {{[]: any}} obj
	 * @returns {str is keyof obj}
	 */
	isKeyof(str, obj) {
		return str in obj;
	},
};
