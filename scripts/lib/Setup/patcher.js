/**
 *
 * @template {object} C
 * @param {C} classToPatch
 *
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 * @param {C[M] extends (...args: any) => any ? (arg: {originalMethod: C[M], args: Parameters<C[M]>}) => ReturnType<C[M]> : never} fn
 */
export function editMethod(classToPatch, methodName, fn) {
	const originalMethod = classToPatch[methodName];

	// @ts-expect-error
	classToPatch[methodName] = function (...args) {
		// @ts-expect-error
		return fn({ originalMethod, args });
	};
}

/**
 *
 *
 * @template {object} C
 * @param {C} objToPatch
 *
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 *
 * @param {C[M] extends (...args: any) => any ? (this: C, ...args: Parameters<C[M]>) => ReturnType<C[M]> : never} fn
 */
export function addMethod(objToPatch, methodName, fn) {
	// @ts-expect-error
	objToPatch[methodName] = fn;
}
