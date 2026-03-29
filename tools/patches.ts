patchPackage('@minecraft/server', {
  replaces: [
    {
      // use name from the function name instead, make eslint rule for it
      find: 'runInterval(callback: () => void, tickInterval?: number): number;',
      replace: 'runInterval(callback: () => void, name: string, tickInterval?: number): number;',
    },
    {
      find: 'runTimeout(callback: () => void, tickDelay?: number): number;',
      replace: 'runTimeout(callback: () => void, name: string, tickDelay?: number): number;',
    },
    {
      find: ` 
     * @throws
     * Throws if the slot's container is invalid.
     *
     * {@link InvalidContainerSlotError}
     */
    readonly typeId: string;`.trim(),
      replace: `
     */
    readonly typeId?: string;`,
    },
  ],
})

import fs from 'fs/promises'
import path from 'path'

import { createRequire } from 'module'

const noticeFirstLine = '* This file was automatically patched by'
export const notice = `/**
${noticeFirstLine}
* tools/patch-package.ts
*
* New method assigments can be found in the
* src/lib/extensions/
*/`

export async function patchPackage(
  packageName: string,
  options: {
    replaces: { find: RegExp | string; replace: string; all?: boolean; throwError?: boolean }[]
  },
) {
  const resolve = createRequire(import.meta.url).resolve
  const packageJsonPath = packageName + '/package.json'

  let packagePath
  try {
    packagePath = resolve(packageJsonPath)
  } catch (e) {
    console.log('Unable to resolve', packageJsonPath, e)
    return
  }

  // Get path to the package's TypeScript definition file
  const indexDts = path.join(packagePath, '..', 'index.d.ts')

  let patchedCode = (await fs.readFile(indexDts, 'utf-8')).replaceAll('\r\n', '\n')
  if (patchedCode.includes(noticeFirstLine)) return console.log('Already patched')

  // Apply the replacements
  for (const { all, find, replace, throwError } of options.replaces) {
    const newCode = patchedCode[all ? 'replaceAll' : 'replace'](find, replace)

    if (newCode !== patchedCode) {
      patchedCode = newCode
    } else {
      if (throwError !== false) throw new Error(`Unable to find replace for ${find}`)
    }
  }

  let newCode = `${notice}\n${patchedCode}\n${notice}`

  // Write the patched code back to the file
  await fs.writeFile(indexDts, newCode)
}
