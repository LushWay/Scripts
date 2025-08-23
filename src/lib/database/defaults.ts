type DynamicObject = Record<string | number | symbol, unknown>

export function setDefaults<D extends DynamicObject>(sourceObject: DynamicObject, defaultObject: D): D {
  if (Array.isArray(sourceObject)) {
    return sourceObject as D
  } else if (Array.isArray(defaultObject)) return defaultObject

  // Create a new object to avoid modifying the original object
  const COMPOSED: DynamicObject = {}

  // Copy properties from the defaults object
  for (const key in defaultObject) {
    const value = sourceObject[key]
    const defaultValue = defaultObject[key]

    if (typeof defaultValue === 'object' && defaultValue !== null) {
      // Value is Object or array, recurse...

      if (Array.isArray(defaultValue)) {
        if (typeof value !== 'undefined' && Array.isArray(value)) {
          COMPOSED[key] = [...value]
        } else {
          COMPOSED[key] = [...defaultValue]
        }
      } else {
        if (key in sourceObject) {
          COMPOSED[key] = setDefaults(value as DynamicObject, defaultValue as DynamicObject)
        } else {
          // If the original object doesn't have the property, add default value
          // And unlink properties...
          COMPOSED[key] = setDefaults({}, defaultValue as DynamicObject)
        }
      }
    } else {
      // Primitive value, assign
      COMPOSED[key] = typeof value === 'undefined' ? defaultValue : value
    }
  }

  // Copy properties from the original object
  for (const key in sourceObject) {
    // If the property is not in the result object, copy it from the original object
    if (!(key in COMPOSED)) {
      COMPOSED[key] = sourceObject[key]
    }
  }

  return COMPOSED as D
}

export function removeDefaults<S extends DynamicObject>(sourceObject: S, defaultObject: DynamicObject): S {
  if (Array.isArray(sourceObject)) return sourceObject

  // Create a new object to avoid modifying the original object
  const COMPOSED: DynamicObject = {}

  for (const key in sourceObject) {
    const value = sourceObject[key]
    const defaultValue = defaultObject[key]

    if (value === defaultValue) continue

    if (typeof defaultValue === 'object' && defaultValue !== null && typeof value === 'object' && value !== null) {
      if (Array.isArray(defaultValue)) {
        //
        if (Array.isArray(value) && Array.equals(value as unknown[], defaultValue)) continue

        COMPOSED[key] = value
      } else {
        //
        const composedSubObject = removeDefaults(value as DynamicObject, defaultValue as DynamicObject)
        if (Object.keys(composedSubObject).length < 1) continue

        COMPOSED[key] = composedSubObject
      }
    } else {
      // Primitive value, assign

      COMPOSED[key] = value
    }
  }

  return COMPOSED as S
}

export function deepClone<T>(value: T): T {
  if (Array.isArray(value)) return [...(value as unknown[]).map(e => deepClone(e))] as T
  if (value !== null && typeof value === 'object') return setDefaults({}, value as DynamicObject) as T

  return value
}
