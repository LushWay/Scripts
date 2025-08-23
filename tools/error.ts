/** Gets common node error properties */
export function error(e: unknown) {
  const code = e && typeof e === 'object' && 'code' in e && typeof e.code === 'string' && e.code

  return {
    cause() {
      return e && e instanceof Error && e.cause ? error(e.cause) : error({})
    },
    is(type: 'EACESS' | 'ENOENT' | 'EEXIST' | 'ECONNREFUSED' | 'EADDRINUSE') {
      return code === type
    },
  }
}
