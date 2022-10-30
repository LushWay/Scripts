const replaces = [
  [/\\/g, "/"],
  [/<anonymous>/, "<>"],
  [/run \(.+\)/],
  // [/\(scripts\/(.+)\)/g, "§8(§7$1§8)§f"],
  [/<> \((.+)\)/, "$1"],
  [/<input>/, "§7<eval>§r"],
  [/(.+)\(native\)/, "§8$1(native)§f"],
  [/\.js:(\S)/, ".js:§6$1§f"],
  [
    /**
     *
     * @param {string} s
     * @returns
     */
    (s) => {
      if (s.includes("lib")) return `§7${s.replace(/§./g, "")}`;
    },
  ],
];

/**
 * @param {string} e
 */
function lowlevelStackParse(e) {
  for (const [r, p] of replaces) {
    if (typeof e === "string")
      // @ts-ignore
      typeof r !== "function" ? (e = e.replace(r, p ?? "")) : (e = r(e));
  }
  return e;
}

/**
 *
 * @param {string} stack
 * @param {number} deleteStack
 * @returns {string}
 */
export function stackParse(deleteStack = 0, stack = getStack(3 + deleteStack)) {
  const stackArray = stack.split("\n");

  const mappedStack = stackArray
    .map((e) => e.replace(/\s+at\s/g, ""))
    .map(lowlevelStackParse)
    .filter((e) => e)
    .map((e) => `\n   ${e}`);

  const finalStack = [];

  mappedStack.forEach((e) => {
    if (!finalStack.includes(e)) finalStack.push(e);
  });

  return finalStack.join("");
}

/**
 *
 * @param {number} pathRemove
 * @returns {string}
 */
function getStack(pathRemove = 1) {
  /** @type {string | string[]} */
  let a = new Error().stack;
  if (typeof a === "string") a = a.split("\n");
  a = a.slice(pathRemove);
  a = a.join("\n");
  return a;
}
