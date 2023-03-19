/**
 * Parse and show error in chat
 * @param {{ message: string; stack?: string; name?: string} | string} e
 * @param {number} [deleteStack]
 * @param {string[]} [additionalStack]
 */
export function DisplayError(e: string | {
    message: string;
    stack?: string;
    name?: string;
}, deleteStack?: number, additionalStack?: string[]): void;
/**
 *
 * @param {number} C
 */
export function createWaiter(C: number): () => Promise<number>;
/**
 * @param {Object} target
 */
export function toStr(target: any, space?: string, cw?: string, funcCode?: boolean, depth?: number): string;
/**
 * Runs the given callback safly. If it throws any error it will be handled
 * @param {Function | (() => void | Promise)} func
 * @param {string} [type]
 * @param {string[]} [additionalStack]
 */
export function handle(func: Function | (() => void | Promise<any>), type?: string, additionalStack?: string[]): Promise<void>;
