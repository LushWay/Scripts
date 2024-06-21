import { world } from '@minecraft/server'

export class PersistentSet<T> extends Set<T> {
  constructor(public id: string) {
    super()
    this.load()
  }

  private load() {
    const id = `PersistentSet<${this.id}>:`
    try {
      const saved = world.getDynamicProperty(this.id)
      if (typeof saved !== 'string') return console.warn(`${id} Dynamic property is not a string:`, saved)

      const values = JSON.parse(saved) as T[]
      if (!Array.isArray(values)) return console.warn(`${id} Dynamic property is not array, it is:`, values)

      values.forEach(value => this.add(value))
    } catch (error) {
      console.error(`${id} Failed to load:`, error)
    }
  }

  save() {
    world.setDynamicProperty(this.id, JSON.stringify([...this]))
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
