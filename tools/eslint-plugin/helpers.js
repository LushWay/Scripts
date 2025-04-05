/**
 * @param {string | undefined | boolean} env
 * @param {import('@typescript-eslint/utils').TSESLint.FlatConfig.Config} config
 */
export function eslintConfigForEnv(env, config) {
  if (env) return config
  return {}
}
