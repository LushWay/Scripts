/**
 *
 * @template {object} C
 * @param {C} classToPatch
 *
 * @template {keyof FunctionFilter<C>} M
 * @param {M} methodName
 * @param {C[M] extends (...args: any) => any ? (arg: {original: C[M], args: Parameters<C[M]>, context: C}) => ReturnType<C[M]> : never} fn
 */
export function editMethod<C extends unknown, M extends string | number | symbol>(classToPatch: C, methodName: M, fn: C[M] extends (...args: any) => any ? (arg: {
    original: C[M];
    args: Parameters<C[M]>;
    context: C;
}) => ReturnType<C[M]> : never): void;
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
export function addMethod<C extends unknown, M extends string | number | symbol>(objToPatch: C, methodName: M, fn: C[M] extends (...args: any) => any ? (this: C, ...args: Parameters<C[M]>) => ReturnType<C[M]> : never): void;
