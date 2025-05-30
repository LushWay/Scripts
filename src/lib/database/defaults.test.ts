import { removeDefaults, setDefaults } from './defaults'

describe('setDefaults', () => {
  it('should return sourceObject when it is an array', () => {
    const sourceArray = [1, 2, 3]
    const defaultObject = { a: 1 }
    const result = setDefaults(sourceArray as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual(sourceArray)
  })

  it('should return defaultObject when it is an array', () => {
    const sourceObject = { a: 1 }
    const defaultArray = [1, 2, 3]
    const result = setDefaults(sourceObject, defaultArray as unknown as Record<string, unknown>)
    expect(result).toEqual(defaultArray)
  })

  it('should not override array', () => {
    const sourceObject = { owners: ['120341'] }
    const defaultObject = { owners: [] }
    const result = setDefaults(sourceObject, defaultObject)
    expect(result).toEqual(sourceObject)
  })

  it('should merge objects with nested structures', () => {
    const sourceObject = { a: { b: 1 }, c: 3 }
    const defaultObject = { a: { b: 2, d: 4 }, e: 5 }
    const result = setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: { b: 1, d: 4 }, c: 3, e: 5 })
  })

  it('should handle defaultObject with null or undefined properties', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { a: null, b: undefined, c: 3 }
    const result = setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it('should handle sourceObject with null or undefined properties', () => {
    const sourceObject = { a: null, b: undefined, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: null, b: 2, c: 3, d: 4 })
  })

  it('should merge objects with primitive values and non-conflicting keys', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { c: 3, d: 4 }
    const result = setDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: 1, b: 2, c: 3, d: 4 })
  })

  it('should not modify original objects', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { b: 3, c: 4 }
    const sourceCopy = { ...sourceObject }
    const defaultCopy = { ...defaultObject }
    setDefaults(sourceObject, defaultObject)
    expect(sourceObject).toEqual(sourceCopy)
    expect(defaultObject).toEqual(defaultCopy)
  })
})

describe('removeDefaults', () => {
  it('should return sourceObject when it is an array', () => {
    const sourceArray = [1, 2, 3]
    const defaultObject = { a: 1 }
    const result = removeDefaults(sourceArray as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual(sourceArray)
  })

  it('should remove properties that match default values', () => {
    const sourceObject = { a: 1, b: 2, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ c: 3 })
  })

  it('should handle nested objects', () => {
    const sourceObject = { a: { b: 1, c: 2 }, d: 3 }
    const defaultObject = { a: { b: 1, c: 3 }, d: 4 }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ a: { c: 2 }, d: 3 })
  })

  it('should handle arrays within objects', () => {
    const sourceObject = { a: [1, 2, 3], b: 2 }
    const defaultObject = { a: [1, 2, 3], b: 2 }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({})
  })

  it('should handle properties with null or undefined values', () => {
    const sourceObject = { a: null, b: undefined, c: 3 }
    const defaultObject = { a: null, b: 2, d: 4 }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ b: undefined, c: 3 })
  })

  it('should not delete not empty arrays', () => {
    const sourceObject = { owners: ['120341'] }
    const defaultObject = { owners: [] }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual(sourceObject)
  })

  it('should not remove properties that do not match default values', () => {
    const sourceObject = { a: 1, b: 3, c: 3 }
    const defaultObject = { a: 1, b: 2, d: 4 }
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({ b: 3, c: 3 })
  })

  it('should handle empty sourceObject and defaultObject', () => {
    const sourceObject = {}
    const defaultObject = {}
    const result = removeDefaults(sourceObject, defaultObject)
    expect(result).toEqual({})
  })

  it('should handle non-object sourceObject', () => {
    const sourceObject = 123
    const defaultObject = { a: 1 }
    const result = removeDefaults(sourceObject as unknown as Record<string, unknown>, defaultObject)
    expect(result).toEqual({})
  })

  it('should not modify original objects', () => {
    const sourceObject = { a: 1, b: 2 }
    const defaultObject = { b: 2, c: 3 }
    const sourceCopy = { ...sourceObject }
    const defaultCopy = { ...defaultObject }
    removeDefaults(sourceObject, defaultObject)
    expect(sourceObject).toEqual(sourceCopy)
    expect(defaultObject).toEqual(defaultCopy)
  })
})
