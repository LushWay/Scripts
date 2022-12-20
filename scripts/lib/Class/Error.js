/** @type {[RegExp | ((s: string) => string), string?][]} */
const replaces = [
	[/\\/g, "/"],
	[/<anonymous>/, "<>"],
	// [/run \(.+\)/],
	// [/\(scripts\/(.+)\)/g, "§8(§7$1§8)§f"],
	[/<> \((.+)\)/, "$1"],
	[/<input>/, "§7<eval>§r"],
	[/(.+)\(native\)/, "§8$1(native)§f"],
	[(s) => (s.includes("lib") || s.includes("xapi.js") ? `§7${s.replace(/§./g, "")}§f` : s)],
	[(s) => (s.startsWith("§7") ? s : s.replace(/\.js:(\d+)/, ".js:§6$1§f"))],
];

/**
 * Parse line of stack
 * @param {string} e
 */
function oneLineStackParse(e) {
	for (const [r, p] of replaces) {
		if (typeof e === "string") typeof r !== "function" ? (e = e.replace(r, p ?? "")) : (e = r(e));
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
export function stackParse(deleteStack = 0, additionalStack = [], stack = getStack(2 + deleteStack)) {
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
