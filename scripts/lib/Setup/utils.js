import { world } from "@minecraft/server";
import { stackParse } from "../Class/Error.js";
import { sleep } from "./timers.js";

/**
 * Parse and show error in chat
 * @param {{ message: string; stack?: string; name?: string} | string} e
 * @param {number} [deleteStack]
 * @param {string[]} [additionalStack]
 */
export function ThrowError(e, deleteStack = 0, additionalStack = []) {
	const isStr = typeof e === "string";
	const stack = stackParse(deleteStack + 1, additionalStack, isStr ? void 0 : e.stack);
	const message = (isStr ? e : e.message).replace(/\n/g, "");
	const type = isStr ? "CommandError" : e?.name ?? "Error";

	const text = `§4${type}: §c${message}\n§f${stack}\n`;
	console.warn(text);

	try {
		world.say(text);
	} catch (e) {
		console.warn(e);
	}
	console.warn(text.replace(/$./g, ""));
}

/**
 *
 * @param {number} C
 */
export function createWaiter(C) {
	let count = 0;
	return async () => {
		count++;
		if (count % C === 0) {
			await sleep(1);
			return count;
		}
	};
}

/**
 * @param {Object} target
 */
export function toStr(target, space = "  ", cw = "", funcCode = false, depth = 0) {
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

	if (depth > 10 || typeof target !== "object") return `${rep(target)}` ?? `${target}` ?? "{}";

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
				value = c.string + "'" + value + "'§r";
				break;

			default:
				value = c.nonstring + value + "§r";
				break;
		}
		return value;
	}

	// avoid Circular structure error
	const visited = new WeakSet();

	return JSON.stringify(target, (_, value) => rep(value), space)?.replace(/"/g, cw);
}

/**
 * Runs the given callback safly. If it throws any error it will be handled
 * @param {Function | (() => void | Promise)} func
 * @param {string} [type]
 * @param {string[]} [additionalStack]
 */
export async function handle(func, type = "Handled", additionalStack) {
	try {
		await func();
	} catch (e) {
		ThrowError(
			{
				message: `${e.name ? `${e.name}: §f` : ""}${e.message ?? e}`,
				name: type,
				stack: e?.stack,
			},
			1,
			additionalStack
		);
	}
}
