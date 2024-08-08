/**
 * Gets common node error properties
 *
 * @param {unknown} e
 */
export function error(e) {
  const code = e && typeof e === 'object' && 'code' in e && typeof e.code === 'string' && e.code

  return {
    code() {
      return code
    },
    cause() {
      return e && e instanceof Error && e.cause ? error(e.cause) : error({})
    },
    /** @param {'EACESS' | 'ENOENT' | 'EEXIST' | 'ECONNREFUSED'} type */
    is(type) {
      return code === type
    },
  }
}
