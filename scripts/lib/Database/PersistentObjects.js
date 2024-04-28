import { world } from '@minecraft/server'
import { OverTakes } from 'lib/Extensions/OverTakes.js'
import { util } from 'lib/util.js'
import { DatabaseError } from './Default.js'

/**
 * @template T
 * @extends {Set<T>}
 */
export class PersistentSet extends Set {
  /** @param {string} id */
  constructor(id) {
    super()
    this.id = id

    try {
      const saved = world.getDynamicProperty(this.id)
      if (typeof saved === 'string') {
        const parsed = JSON.parse(saved)
        if (!Array.isArray(parsed)) {
          console.warn(`PersistentSet<${id}>: Dynamic property is not array, it is:`, parsed)
          return
        }

        parsed.forEach(value => this.add(value))
      }
    } catch (error) {
      util.error(new DatabaseError(`Failed to init PersistentSet<${id}>`))
      util.error(error)
    }
  }

  save() {
    world.setDynamicProperty(this.id, JSON.stringify([...this]))
  }
}

OverTakes(PersistentSet.prototype, {
  add(...args) {
    super.add(...args)
    this.save()
    return this
  },
  delete(...args) {
    const result = super.delete(...args)
    this.save()
    return result
  },
  clear() {
    super.clear()
    this.save()
  },
})
