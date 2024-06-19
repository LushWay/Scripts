/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { world } from '@minecraft/server'
import { expand } from 'lib/extensions/extend'

export class PersistentSet<T> extends Set<T> {
  constructor(public id: string) {
    super()
    this.load()
  }

  private load() {
    try {
      const saved = world.getDynamicProperty(this.id)
      if (typeof saved === 'string') {
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed)) {
          console.warn(`PersistentSet<${this.id}>: Dynamic property is not array, it is:`, parsed)
          return
        }

        parsed.forEach(value => this.add(value as T))
      }
    } catch (error) {
      console.error(`Failed to init PersistentSet<${this.id}>`, error)
    }
  }

  save() {
    world.setDynamicProperty(this.id, JSON.stringify([...this]))
  }
}

expand(PersistentSet.prototype, {
  add(...args: unknown[]) {
    super.add(...args)
    this.save()
    return this
  },
  delete(...args: unknown[]) {
    const result = super.delete(...args)
    this.save()
    return result as boolean
  },
  clear() {
    super.clear()
    this.save()
  },
})
