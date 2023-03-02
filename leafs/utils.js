// @ts-check

import * as fs from "fs/promises";
import path from "path";

/**
 * Replaces and adds code to a package's TypeScript definition file.
 * @param {string} packageName - The name of the package to patch.
 * @param {object} options - The patching options.
 * @param {{find: RegExp | string, replace: string, all?: boolean}[]} options.replaces - The replacements to make to the original code. Each object in the array should have a `find` and `replace` property.
 * @param {Record<string, string> | undefined} options.classes Pairs of class name and method to add.
 * @param {object} options.additions
 * @param {string} options.additions.beginning - The code to add to the beginning of the file.
 * @param {string} options.additions.afterImports - The code to add after any import statements.
 * @param {string} options.additions.ending - The code to add to the end of the file.
 */
export async function patchPackage(packageName, options) {
	// Get the path to the package's TypeScript definition file
	const packagePath = path.join("node_modules", packageName, `index.d.ts`);

	// Read the original code from the file
	const originalCode = await fs.readFile(packagePath, "utf-8");

	// Apply the replacements
	let patchedCode = originalCode;
	for (const replace of options.replaces) {
		patchedCode = patchedCode[replace.all ? "replaceAll" : "replace"](
			replace.find,
			replace.replace
		);
	}

	options.additions.beginning ??= "";
	options.additions.ending ??= "";

	let newCode = `${options.additions.beginning}\n${patchedCode}\n${options.additions.ending}`;

	if (options.additions.afterImports) {
		const lines = newCode.split(/\n/g);
		/** @type {[number, string][]} */
		const newLines = [];

		let lastImport = 0;
		for (const [i, raw_line] of lines.entries()) {
			const line = raw_line.trimStart();

			if (line.startsWith("import ")) lastImport = i + 1;

			if (line.startsWith("class ") && options.classes) {
				const match = line.match(/^class\s+(\w+)\s+\{/);

				if (match) {
					const [, className] = match;

					if (className in options.classes) {
						const addition = options.classes[className];

						newLines.push([i + 1, addition]);
					}
				}
			}
		}

		newCode = addEls(lines, [
			[lastImport, options.additions.afterImports],
			...newLines,
		]).join("\n");
	}

	// Write the patched code back to the file
	await fs.writeFile(packagePath, newCode);
}

/**
 *
 * @template T
 * @param {Array<T>} arr
 * @param {[number, T][]} additions
 * @returns
 */
function addEls(arr, additions) {
	let result = [];
	let currentAdditionIndex = 0;
	for (let i = 0; i < arr.length; i++) {
		if (
			currentAdditionIndex < additions.length &&
			i === additions[currentAdditionIndex][0]
		) {
			// If there's an addition for the current index, add it before the current element
			result.push(additions[currentAdditionIndex][1]);
			currentAdditionIndex++;
		}
		result.push(arr[i]);
	}
	// Add any remaining additions to the end of the array
	while (currentAdditionIndex < additions.length) {
		result.push(additions[currentAdditionIndex][1]);
		currentAdditionIndex++;
	}
	return result;
}

/**
 * Multi-line function
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 */
export function m(strings, ...values) {
	// Combine the template strings and values into a single string
	let newString = strings.reduce((result, string, i) => {
		return result + values[i - 1] + string;
	});

	// Remove the first newline character, if it exists
	if (newString.charAt(0) === "\n") {
		newString = newString.slice(1);
	}

	// Remove the end newline character, if it exists
	if (newString.endsWith("\n")) {
		newString = newString.substring(0, newString.length - 1);
	}

	return newString;
}
