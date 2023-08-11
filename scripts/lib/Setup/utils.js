import { system } from "@minecraft/server";
import { errorMessageParse, stackParse } from "../Class/Error.js";

export const util = {
	settings: {
		BDSMode: true,
	},
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

	/**
	 * Replaces each §<color> to its terminal eqiuvalent
	 * @param {string} text
	 */
	toTerminalColors(text) {
		if (this.settings.BDSMode)
			return text.replace(/§(.)/g, (_, a) => colors[a] ?? colors.r) + colors.r;

		return text.replace(/§(.)/g, "");
	},
	/**
	 * @type {Record<string, string>}
	 */
	terminalColors: void 0,
};

/**
 * @type {Record<string, string>}
 */
const colors = {
	0: "\x1B[30m",
	1: "\x1B[38;2;0;0;175m",
	2: "\x1B[38;2;0;175;0m",
	3: "\x1B[38;2;0;175;175m",
	4: "\x1B[38;2;175;0;0m",
	5: "\x1B[38;2;175;0;175m",
	6: "\x1B[38;2;255;175;0m",
	7: "\x1B[38;2;175;175;175m",
	8: "\x1B[38;2;85;85;85m",
	9: "\x1B[38;2;85;85;255m",
	q: "\x1B[38;2;20;160;60m",
	e: "\x1B[38;2;255;255;85m",
	r: "\x1B[0m",
	t: "\x1B[38;2;30;70;125m",
	u: "\x1B[38;2;155;95;195m",
	i: "\x1B[38;2;205;200;200m",
	o: "\x1B[3m",
	p: "\x1B[38;2;255;175;45m",
	a: "\x1B[38;2;85;255;80m",
	s: "\x1B[38;2;55;180;165m",
	d: "\x1B[38;2;255;85;255m",
	g: "\x1B[38;2;240;205;20m",
	f: "\x1B[37m",
	h: "\x1B[38;2;255;215;205m",
	j: "\x1B[38;2;70;55;55m",
	l: "\x1B[1m",
	c: "\x1B[38;2;255;85;85m",
	b: "\x1B[38;2;85;255;255m",
	n: "\x1B[38;2;185;100;75m",
	m: "\x1B[38;2;150;20;5m",
};

util.terminalColors = colors;
