/**
 * Parse stack
 * @param {string} stack
 * @param {string[]} additionalStack
 * @param {number} deleteStack
 * @returns {string}
 */
export function stackParse(deleteStack?: number, additionalStack?: string[], stack?: string): string;
/**
 * Adds a line to existing error stack
 * @param {string} stack
 * @param {...string} lines
 */
export function applyToStack(stack: string, ...lines: string[]): string;
