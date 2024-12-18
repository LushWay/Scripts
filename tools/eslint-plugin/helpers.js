/** @import {TSESLint} from '@typescript-eslint/utils' */

/**
 * @param {string | undefined | boolean} env
 * @param {TSESLint.FlatConfig.Config} config
 */
export function eslintConfigForEnv(env, config) {
  if (env) return config
  return []
}
