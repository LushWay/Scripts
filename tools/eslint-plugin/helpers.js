/** @import TSLint from "typescript-eslint" */

/**
 * @param {string | undefined | boolean} env
 * @param {TSLint.Config} config
 */
export function eslintConfigForEnv(env, config) {
  if (env) return config
  return []
}
