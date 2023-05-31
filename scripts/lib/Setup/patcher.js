/**
 *
*
* @template {object} C
* @param {C} classToPatch
*
* @template {keyof FunctionFilter<C>} M
* @param {M} methodName

 * @template {(...args: any) => any} [FN=C[M] extends (...args: any) => any? C[M] : never] Specify old type of function if needed
 * @param {(arg: {original: FN, args: Parameters<FN>, context: C}) => ReturnType<FN>} fn
 */
export function editMethod(classToPatch, methodName, fn) {
	const originalMethod = classToPatch[methodName];

	// @ts-expect-error
	classToPatch[methodName] = function (...args) {
		return fn({
			// @ts-expect-error
			original: originalMethod.bind(this),
			// @ts-expect-error
			args,
			context: this,
		});
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
