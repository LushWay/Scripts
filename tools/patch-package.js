import fs from 'fs/promises'
import path from 'path'

import { pathInfo } from 'leafy-utils'
import { createRequire } from 'module'

const Notice = '* This file was automatically patched by'
export const notice = `/**
${Notice}
* tools/patch-package.js
*
* New methods assigments can be founded in
* scripts/lib/Extensions
*/`

export const { relative } = pathInfo(import.meta.url)
const require = createRequire(import.meta.url)
export const resolve = require.resolve

/**
 * Replaces and adds code to a package's TypeScript definition file.
 *
 * @param {string} packageName - The name of the package to patch.
 * @param {object} options - The patching options.
 * @param {{ find: RegExp | string; replace: string; all?: boolean; throw?: boolean }[]} options.replaces - The
 *   replacements to make to the original code. Each object in the array should have a `find` and `replace` property.
 * @param {Record<string, string> | undefined} options.classes Pairs of class name and method to add.
 * @param {object} options.additions
 * @param {string} options.additions.beginning - The code to add to the beginning of the file.
 * @param {string} options.additions.afterImports - The code to add after any import statements.
 * @param {string} options.additions.ending - The code to add to the end of the file.
 */
export async function patchPackage(packageName, options) {
  // Get path to the package's TypeScript definition file
  const indexDts = path.join(resolve(path.join(packageName, 'package.json')), '..', 'index.d.ts')

  let patchedCode = (await fs.readFile(indexDts, 'utf-8')).replaceAll('\r\n', '\n')
  if (patchedCode.includes(Notice)) return console.log('\x1B[94m➤\x1B[39m \x1B[90mYN0000\x1B[39m: Already patched')

  // Apply the replacements
  for (const replace of options.replaces) {
    const replaceFN = replace.all ? patchedCode.replaceAll : patchedCode.replace
    const newCode = replaceFN.call(patchedCode, replace.find, replace.replace)

    if (newCode !== patchedCode) {
      patchedCode = newCode
    } else {
      if (replace.throw !== false) throw new Error(`Unable to find replace for ${replace.find}`)
    }
  }

  options.additions.beginning ??= ''
  options.additions.ending ??= ''

  let newCode = `${options.additions.beginning}\n${patchedCode}\n${options.additions.ending}`

  if (options.additions.afterImports) {
    const lines = newCode.split(/\n/g)
    /** @type {[number, string][]} */
    const newLines = []

    let lastImport = 0
    for (const [i, rawLine] of lines.entries()) {
      const line = rawLine.trimStart()

      if (line.startsWith('import ')) lastImport = i + 1

      const match = line.match(/^(?:export )?class\s+(\w+)\s+/)
      if (options.classes && match) {
        if (match) {
          const [, className] = match

          if (className in options.classes) {
            const addition = options.classes[className]

            newLines.push([i + 1, addition])
          }
        }
      }
    }

    newCode = addEls(lines, [[lastImport, options.additions.afterImports], ...newLines]).join('\n')
  }

  // Write the patched code back to the file
  await fs.writeFile(indexDts, newCode)
}

/**
 * @template T
 * @param {T[]} arr
 * @param {[number, T][]} additions
 * @returns
 */
function addEls(arr, additions) {
  const result = []
  let currentAdditionIndex = 0
  for (let i = 0; i < arr.length; i++) {
    if (currentAdditionIndex < additions.length && i === additions[currentAdditionIndex][0]) {
      // If there's an addition for the current index, add it before the current element
      result.push(additions[currentAdditionIndex][1])
      currentAdditionIndex++
    }
    result.push(arr[i])
  }
  // Add any remaining additions to the end of the array
  while (currentAdditionIndex < additions.length) {
    result.push(additions[currentAdditionIndex][1])
    currentAdditionIndex++
  }
  return result
}

/**
 * Multi-line function
 *
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 */
export function m(strings, ...values) {
  // Combine the template strings and values into a single string
  let newString = strings.reduce((result, string, i) => {
    return result + values[i - 1] + string
  })

  // Remove the first newline character, if it exists
  if (newString.charAt(0) === '\n') {
    newString = newString.slice(1)
  }

  // Remove the end newline character, if it exists
  if (newString.endsWith('\n')) {
    newString = newString.substring(0, newString.length - 1)
  }

  return newString
}
