/**
 * @author ConMaster2112
 * @template b
 * @param {b} prototype
 * @param {PartialParts<b>} object
 * @returns {b}
 */
export function OverTakes(prototype, object) {
  const prototypeOrigin = Object.setPrototypeOf(
    Object.defineProperties({}, Object.getOwnPropertyDescriptors(prototype)),
    Object.getPrototypeOf(prototype)
  )
  Object.setPrototypeOf(object, prototypeOrigin)
  Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(object))
  return prototypeOrigin
}
