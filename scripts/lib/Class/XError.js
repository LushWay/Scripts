/** @type {[RegExp | ((s: string) => string), string?][]} */
const REPLACES = [
	[/\\/g, "/"],
	[/<anonymous>/, "<>"],
	[/<> \((.+)\)/, "$1"],
	[/<input>/, "§7<eval>§r"],
	[/(.*)\(native\)(.*)/, "§8$1(native)$2§f"],
	[
		(s) =>
			s.includes("lib") || s.includes("xapi.js")
				? `§7${s.replace(/§./g, "")}§f`
				: s,
	],
	[(s) => (s.startsWith("§7") ? s : s.replace(/\.js:(\d+)/, ".js:§6$1§f"))],
];

/**
 * Parse line of stack
 * @param {string} e
 */
function oneLineStackParse(e) {
	for (const [r, p] of REPLACES) {
		if (typeof e !== "string" || e.length < 1) break;

		if (typeof r === "function") e = r(e);
		else e = e.replace(r, p ?? "");
	}
	return e;
}

/**
 * Parse stack
 * @param {string} stack
 * @param {string[]} additionalStack
 * @param {number} deleteStack
 * @returns {string}
 */
export function stackParse(
	deleteStack = 0,
	additionalStack = [],
	stack = getStack(2 + deleteStack)
) {
	const stackArray = additionalStack.concat(stack.split("\n"));

	const mappedStack = stackArray
		.map((e) => e?.replace(/\s+at\s/g, "")?.replace(/\n/g, ""))
		.map(oneLineStackParse)
		.filter((e) => e && /^\s*\S/g.test(e))
		.map((e) => `   ${e}\n`);

	return mappedStack.join("");
}

/**
 * Creates new stack
 * @param {number} pathRemove
 * @returns {string}
 */
function getStack(pathRemove = 0) {
	let a = new Error().stack.split("\n");
	a = a.slice(pathRemove);
	return a.join("\n");
}

/**
 * Adds a line to existing error stack
 * @param {string} stack
 * @param {...string} lines
 */
export function applyToStack(stack, ...lines) {
	stack = stack ?? "";
	let parsedStack = stack.split("\n");
	parsedStack = [...lines, ...parsedStack];
	return parsedStack.join("\n");
}

/** @type {[RegExp | string, string, string?][]} */
const MESSAGE_REPLACES = [
	[/\n/g, ""],
	[
		/Module \[(.*)\] not found\. Native module error or file not found\./g,
		"§cNot found: §6$1",
		"LoadError",
	],
];

/**
 *
 * @param {Error} error
 */
export function errorMessageParse(error) {
	let message = error.message;
	for (const [find, replace, newname] of MESSAGE_REPLACES) {
		const newmessage = message.replace(find, replace);
		if (newmessage !== message && newname) error.name = newname;
		message = newmessage;
	}

	return message;
}
