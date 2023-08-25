import { system } from "@minecraft/server";
import { TerminalColors } from "../List/terminal-colors.js";

export const util = {
  settings: {
    BDSMode: true,
    firstLoad: false,
  },
  error: Object.assign(
    /**
     * Parse and show error in chat
     * @param {{ message: string; stack?: string; name?: string} | string} error
     * @param {object} [arg2]
     * @param {number} [arg2.deleteStack]
     * @param {string[]} [arg2.additionalStack]
     * @param {string} [arg2.errorName]
     */
    function error(
      error,
      { deleteStack = 0, additionalStack = [], errorName } = {}
    ) {
      if (typeof error === "string") {
        error = new Error(error);
        error.name = "StringError";
      }
      const stack = util.error.stack.get(
        deleteStack + 1,
        additionalStack,
        error.stack
      );
      const message = util.error.message.get(error);
      const name = errorName ?? error?.name ?? "Error";
      const text = `§4${name}: §c${message}\n§f${stack}`;

      try {
        // if (onWorldLoad.loaded()) world.say(text);
        console.error(text);
      } catch (e) {}
    },
    {
      stack: {
        /** @type {[RegExp | ((s: string) => string), string?][]} */
        modifiers: [
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
          [
            (s) =>
              s.startsWith("§7") ? s : s.replace(/\.js:(\d+)/, ".js:§6$1§f"),
          ],
        ],

        /**
         * Parse stack
         * @param {string[]} additionalStack
         * @param {number} deleteStack
         * @param {string} [stack]
         * @returns {string}
         */
        get(deleteStack = 0, additionalStack = [], stack) {
          if (!stack) {
            stack = new Error().stack;
            if (!stack) return "Null stack";
            stack = stack
              .split("\n")
              .slice(deleteStack + 1)
              .join("\n");
          }

          const stackArray = additionalStack.concat(stack.split("\n"));

          const mappedStack = stackArray
            .map((e) => e?.replace(/\s+at\s/g, "")?.replace(/\n/g, ""))
            .map((e) => {
              for (const [r, p] of this.modifiers) {
                if (typeof e !== "string" || e.length < 1) break;

                if (typeof r === "function") e = r(e);
                else e = e.replace(r, p ?? "");
              }
              return e;
            })
            .filter((e) => e && /^\s*\S/g.test(e))
            .map((e) => `   ${e}\n`);

          return mappedStack.join("");
        },
      },
      message: {
        /** @type {[RegExp | string, string, string?][]} */
        modifiers: [
          [/\n/g, ""],
          [
            /Module \[(.*)\] not found\. Native module error or file not found\./g,
            "§cNot found: §6$1",
            "LoadError",
          ],
        ],

        /**
         * @param {{message?: string, name?: string}} error
         */
        get(error) {
          let message = error.message ?? "";
          for (const [find, replace, newname] of this.modifiers) {
            const newmessage = message.replace(find, replace);
            if (newmessage !== message && newname) error.name = newname;
            message = newmessage;
          }

          return message;
        },
      },
    }
  ),

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

            const match = r.match(/(\w*)\(/)?.[1];
            if (match) {
              name = match;
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
          value = `${c.string}\`${value
            .replace(/"/g, uniqueKey)
            .replace(/§/g, "§§")}\`§r`;
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
  async catch(func, type = "Handled", additionalStack) {
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

  benchmark: Object.assign(
    /**
     * It returns a function that when called, returns the time it took to call the function and records result to const
     * @param {string} label - The name of the benchmark.
     * @returns {() => number} A function that returns the time it took to run the function.
     */
    function benchmark(label, type = "test") {
      const start_time = Date.now();

      return function end() {
        const took_time = Date.now() - start_time;
        util.benchmark.results[type] ??= {};
        util.benchmark.results[type][label] ??= [];
        util.benchmark.results[type][label].push(took_time);
        return took_time;
      };
    },
    {
      /** @type {Record<string, Record<string, number[]>>} */
      results: {},
    }
  ),

  strikeTest() {
    let start = Date.now();
    /**
     * @param {string} label
     */
    return (label) => {
      const date = Date.now();
      console.log(label, "§e" + (date - start) + "ms");
      start = date;
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
      return (
        text.replace(
          /§(.)/g,
          (_, a) => this.terminalColors[a] ?? this.terminalColors.r
        ) + this.terminalColors.r
      );

    return text.replace(/§(.)/g, "");
  },
  /**
   * @type {Record<string, string>}
   */
  terminalColors: {},
};

util.terminalColors = TerminalColors;
