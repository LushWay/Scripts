import { ESLintUtils } from '@typescript-eslint/utils'
import path from 'path'

export const createRule = ESLintUtils.RuleCreator(name => `https://example.com/rule/${name}`)

/** @typedef {{ cwd: string; filename: string }} Context */

/**
 * @param {Context} context
 * @param {string | null | undefined} [filename]
 */
export function toRelative(context, filename = context.filename) {
  if (!filename) return ''

  return filename.replace(context.cwd, '').replaceAll(path.sep, '/')
}

/** @param {Context} context */
export function isScriptsDirectory(context) {
  return toRelative(context).startsWith('/src')
}

/** @param {Context} context */
export function isLibDirectory(context) {
  return toRelative(context).startsWith('/src/lib')
}

/**
 * @param {Context} context
 * @param {string | null | undefined} [filename]
 */
export function isModulesDirectory(context, filename = context.filename) {
  const relative = toRelative(context, filename)
  return relative.startsWith('/src/modules')
}
