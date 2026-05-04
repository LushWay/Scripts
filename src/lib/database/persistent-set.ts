import { onLoad, OnLoadPriority } from 'lib/utils/load-ref'
import { LongDynamicProperty } from './properties'

export class LimitedSet<T> extends Set<T> {
  constructor(protected limit = 1_000) {
    super()
  }

  add(value: T) {
    if (this.size >= this.limit) this.delete(this.values().next().value ?? ('' as T))
    return super.add(value)
  }
}

export class PersistentSet<T extends Json> extends LimitedSet<T> {
  constructor(
    public id: string,
    protected limit = 1_000,
  ) {
    super()
    for (const key in LimitedSet.prototype) {
      ;(this as Record<string, unknown>)[key] = () => {
        throw new Error(`PersistentSet<${id}> is not yet loaded!`)
      }
    }
  }

  onLoad = onLoad(() => this.load(), OnLoadPriority.Database).onLoad

  private load() {
    const id = `PersistentSet<${this.id}>:`
    try {
      const values = LongDynamicProperty.get(this.id, '[]')
      if (typeof values === 'undefined') return // Set was not saved
      if (!Array.isArray(values)) return console.warn(`${id} Dynamic property is not array, it is:`, values)

      values.forEach(e => this.add(e as T))

      for (const [key, value] of Object.entries(LimitedSet.prototype)) (this as Record<string, unknown>)[key] = value
    } catch (error) {
      console.error(`${id} Failed to load:`, error)

      for (const key in LimitedSet.prototype) {
        ;(this as Record<string, unknown>)[key] = () => {
          throw new Error(`PersistentSet<${id}> Failed to load: ${error}`)
        }
      }
    }
  }

  protected save() {
    LongDynamicProperty.set(this.id, JSON.stringify([...this]))
    return this
  }

  add(value: T) {
    super.add(value)
    return this.save()
  }

  delete(key: T) {
    const result = super.delete(key)
    this.save()
    return result
  }

  clear() {
    super.clear()
    this.save()
  }
}
