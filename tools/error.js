/**
 * Gets common node error properties
 *
 * @param {unknown} error
 */
export function error(error) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code

  return {
    code() {
      return code
    },
    /** @param {'EACESS' | 'ENOENT' | 'EEXIST'} type */
    is(type) {
      return code === type
    },
  }
}
