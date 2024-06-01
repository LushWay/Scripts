/* eslint-disable @typescript-eslint/no-unsafe-argument */
type PartialParts<B, ThisArg = B> = {
  [P in keyof B]?: B[P] extends (...param: infer param) => infer ret ? (this: ThisArg, ...param: param) => ret : B[P]
}

/**
 * Adds properties to the provided object prototype
 *
 * Can override and modify properties
 *
 * @author ConMaster2112
 */
export function expand<B>(prototype: B, object: PartialParts<B>): B {
  const prototypeOrigin = Object.setPrototypeOf(
    Object.defineProperties({}, Object.getOwnPropertyDescriptors(prototype)),
    Object.getPrototypeOf(prototype),
  )
  Object.setPrototypeOf(object, prototypeOrigin)
  Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(object))
  return prototypeOrigin
}
