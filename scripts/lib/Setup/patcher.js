import { world, World } from "@minecraft/server";

/**
 *
 * @template {object} C
 * @param {{prototype: C}} classToPatch
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 * @param {C[M] extends (...args: any) => any ? (arg: {originalMethod: C[M], args: Parameters<C[M]>}) => ReturnType<C[M]> : never} fn
 */
function patch(classToPatch, methodName, fn) {
	const originalMethod = classToPatch.prototype[methodName];

	// @ts-expect-error
	classToPatch.prototype[methodName] = function (...args) {
		// @ts-expect-error
		return fn({ originalMethod, args });
	};
}

const originalSay = world.say;

World.prototype["debug"] = function (...args) {
	originalSay(args.map((e) => JSON.stringify(e, null, " ")).join(" "));
};

let logs = {};
World.prototype["logOnce"] = function (name, ...data) {
	if (logs[name]) return;
	world["debug"](...data);
};
