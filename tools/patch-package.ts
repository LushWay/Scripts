import fs from 'fs/promises'
import path from 'path'

import { pathInfo } from 'leafy-utils'
import { createRequire } from 'module'

const Notice = '* This file was automatically patched by'
export const notice = `/**
${Notice}
* tools/patch-package.ts
*
* New method assigments can be found in the
* src/lib/extensions/
*/`

export const { relative } = pathInfo(import.meta.url)
const require = createRequire(import.meta.url)
export const resolve = require.resolve

/**
 * Replaces and adds code to a package's TypeScript definition file.
 *
 * @param packageName - The name of the package to patch.
 * @param options - The patching options.
 * @param options.replaces - The replacements to make to the original code. Each object in the array should have a
 *   `find` and `replace` property.
 * @param options.classes Pairs of class name and method to add.
 * @param options.additions
 * @param options.additions.beginning - The code to add to the beginning of the file.
 * @param options.additions.afterImports - The code to add after any import statements.
 * @param options.additions.ending - The code to add to the end of the file.
 */
export async function patchPackage(
  packageName: string,
  options: {
    replaces: { find: RegExp | string; replace: string; all?: boolean; throwError?: boolean }[]
    classes: Record<string, string> | undefined
    additions: { beginning: string; afterImports: string; ending: string }
  },
) {
  const packageJsonPath = path.join(packageName, 'package.json')
  let packagePath
  try {
    packagePath = resolve(packageJsonPath)
  } catch {
    console.log('Unable to resolve', packageJsonPath)
    return
  }

  // Get path to the package's TypeScript definition file
  const indexDts = path.join(packagePath, '..', 'index.d.ts')

  let patchedCode = (await fs.readFile(indexDts, 'utf-8')).replaceAll('\r\n', '\n')
  if (patchedCode.includes(Notice)) return console.log('\x1B[94m➤\x1B[39m \x1B[90mYN0000\x1B[39m: Already patched')

  // Apply the replacements
  for (const { all, find, replace, throwError } of options.replaces) {
    const newCode = patchedCode[all ? 'replaceAll' : 'replace'](find, replace)

    if (newCode !== patchedCode) {
      patchedCode = newCode
    } else {
      if (throwError !== false) throw new Error(`Unable to find replace for ${find}`)
    }
  }

  options.additions.beginning ??= ''
  options.additions.ending ??= ''

  let newCode = `${options.additions.beginning}\n${patchedCode}\n${options.additions.ending}`

  if (options.additions.afterImports) {
    const lines = newCode.split(/\n/g)
    const newLines: [number, string][] = []

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

function addEls<T>(arr: T[], additions: [number, T][]) {
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

/** Multi-line function */
export function m(strings: TemplateStringsArray, ...values: any[]) {
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
