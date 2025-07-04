import { writeFile } from 'fs/promises'
import path from 'path'

function injectCode(modifier: string, code: string) {
  return `// prettier-ignore
/* eslint-disable */
// This file is autogenerated by ${modifier}.
// Do not modify manually.
    
${code}
`.replace(/(?:\r)?\n/g, '\r\n')
}

export async function injectAsset(
  asset: string,
  caller: string,
  code: string | (() => Promise<string> | string),
  base = '.',
  p = path.join(base, 'src', 'lib', 'assets', asset),
) {
  try {
    if (typeof code === 'function') code = await code()

    await writeFile(p, injectCode(caller, code))
  } catch (e) {
    console.error(`Unable to write asset ${asset}:`, e)
  }
}

export function toUpper(k: string) {
  const id = k.replace(/(?:\/|_)(.)?/g, (_, e) => e?.toUpperCase() ?? '')
  return id[0].toUpperCase() + id.slice(1)
}

export function injectEnum(name: string, entries: readonly (readonly [string, string])[], upperify = true) {
  return `export enum ${name} {
${entries.map(([k, e]) => `  ${upperify ? toUpper(k) : k} = '${e}',`).join('\n')}
}`
}
