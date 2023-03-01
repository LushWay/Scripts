/**
 *
 * @param {any} obj
 * @returns {obj is {prototype: any}}
 */
function hasPrototype(obj) {
	return (
		obj &&
		typeof obj === "object" &&
		obj.prototype &&
		typeof obj?.prototype === "object"
	);
}

/**
 *
 * @template {"in prototype of" | "in"} IsProto
 * @param {IsProto} isPrototype
 *
 * @template {object} C
 * @param {IsProto extends "in" ? C : { prototype: C}} classToPatch
 *
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 * @param {C[M] extends (...args: any) => any ? (arg: {originalMethod: C[M], args: Parameters<C[M]>}) => ReturnType<C[M]> : never} fn
 */
export function editMethod(isPrototype, classToPatch, methodName, fn) {
	/** @type {any} */
	let objToEdit = classToPatch;

	if (isPrototype === "in prototype of") {
		if (!hasPrototype(classToPatch))
			throw new TypeError(
				"You need a prototype property in object to edit, otherwise use 'editMethod(\"in\", ...)'"
			);

		objToEdit = classToPatch.prototype;
	}

	const originalMethod = objToEdit[methodName];

	objToEdit[methodName] = function (...args) {
		// @ts-expect-error
		return fn({ originalMethod, args });
	};
}

/**
 *
 * @template {"to prototype in" | "to"} IsProto
 * @param {IsProto} isPrototype
 *
 * @template {object} C
 * @param {IsProto extends "to" ? C : { prototype: C}} objToPatch
 *
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 *
 * @param {C[M] extends (...args: any) => any ? (this: C, ...args: Parameters<C[M]>) => ReturnType<C[M]> : never} fn
 */
export function addMethod(isPrototype, objToPatch, methodName, fn) {
	/** @type {any} */
	let objToEdit = objToPatch;

	if (isPrototype === "to prototype in") {
		if (!hasPrototype(objToPatch))
			throw new TypeError(
				"You need a prototype property in object to edit, otherwise use 'addMethod(\"to\", ...)'"
			);

		objToEdit = objToPatch.prototype;
	}

	objToEdit[methodName] = fn;
}
