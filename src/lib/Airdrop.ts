import { Entity, Vector, system, world } from '@minecraft/server'

import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { actionGuard } from 'lib/Region/index'
import { DynamicPropertyDB } from 'lib/database/properties'
import { util } from 'lib/util'
import { invalidLocation } from './GameUtils'
import { LootTable } from './LootTable'
import { Temporary } from './Temporary'

export class Airdrop {
  static db = new DynamicPropertyDB('airdrop', {
    /** @type {Record<string, { chicken: string; chest: string; loot: string; for?: string; looted?: true }>} */
    type: {},
  }).proxy()

  static minecartTag = 'chest_minecart:loot'

  static chickenTag = 'chicken:loot'

  static chestOffset = { x: 0, y: -2, z: 0 }

  /** @type {Airdrop[]} */
  static instances = []

  chestMinecart

  chicken

  for

  id

  lootTable

  /** @type {'restoring' | 'falling' | 'being looted'} */
  status = 'restoring'

  /**
   * @param {{ position?: Vector3; loot: LootTable; for?: string }} options
   * @param {string} [id]
   */
  constructor(options, id) {
    this.lootTable = options.loot
    this.for = options.for
    this.id = id

    if (!this.id) {
      this.id = new Date().toISOString()
      if (options.position) this.spawn(options.position)
    }

    // @ts-expect-error TS(2345) FIXME: Argument of type 'this' is not assignable to param... Remove this comment to see the full error message
    Airdrop.instances.push(this)
  }

  /**
   * Spawns airdrop at the given position
   *
   * @param {Vector3} position - Position to spawn airdrop on
   */
  spawn(position) {
    console.debug('spawning airdrop at', Vector.string(Vector.floor(position), true))

    this.chicken = world.overworld.spawnEntity('minecraft:chicken<chicken:drop>', position)
    this.chestMinecart = world.overworld.spawnEntity(
      'minecraft:chest_minecart<chest_minecart:drop>',
      Vector.add(position, Airdrop.chestOffset),
    )

    let chest = false
    let chicken = false

    // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
    new Temporary(({ world, cleanup }) => {
      world.afterEvents.entitySpawn.subscribe(event => {
        if (event.entity.id === this.chestMinecart?.id) {
          this.chestMinecart.addTag(Airdrop.minecartTag)
          console.debug('spawned chest minecart')
          chest = true
          if (chicken) cleanup()
        }

        if (event.entity.id === this.chicken?.id) {
          this.chicken.addTag(Airdrop.chickenTag)
          console.debug('spawned chicken')
          chicken = true
          if (chest) cleanup()
        }
      })
    })

    this.status = 'falling'
    this.save()
  }

  teleport() {
    if (!this.chestMinecart || !this.chicken || !this.chicken.isValid() || !this.chestMinecart.isValid()) return

    this.chestMinecart.teleport(Vector.add(this.chicken.location, Airdrop.chestOffset))
    if (!this.chestMinecart.dimension.getBlock(this.chestMinecart.location)?.below()?.isAir) {
      this.beingLooted()
    }
  }

  beingLooted() {
    if (!this.chestMinecart || !this.chicken) return

    this.chestMinecart.triggerEvent('chest_minecart:ground')
    try {
      console.debug('Loading loot table', this.lootTable ? this.lootTable.id : 'NO NAME')
      if (this.chestMinecart.container) this.lootTable.fillContainer(this.chestMinecart.container)
    } catch (e) {
      console.error('Failed to load loot table into airdrop:', e)
    }

    this.chicken.remove()
    this.status = 'being looted'
    this.save()
  }

  save() {
    if (!this.chestMinecart || !this.chicken) return

    Airdrop.db[this.id] = {
      for: this.for,
      chest: this.chestMinecart.id,
      chicken: this.chicken.id,
      loot: this.lootTable.id,
      ...(this.status === 'being looted' ? { looted: true } : {}),
    }
  }

  /**
   * Shows particle trace under chest minecart
   *
   * @param {Vector3} [from]
   */
  async showParticleTrace(from, minecart = this.chestMinecart) {
    if (!from && minecart && minecart.isValid()) {
      from = minecart.location
    }

    if (from) {
      let { x, z } = from
      x -= 0
      z -= 0

      // eslint-disable-next-line for-direction
      for (let y = from.y; y > from.y - 10; y--) {
        try {
          world.overworld.spawnParticle('minecraft:balloon_gas_particle', { x, y, z })
          await system.sleep(3)
        } catch (error) {
          if (invalidLocation(error)) continue
          util.error(error)
        }
      }
    }
  }

  delete() {
    Airdrop.instances = Airdrop.instances.filter(e => e !== this)
    Reflect.deleteProperty(Airdrop.db, this.id)

    /** @param {'chestMinecart' | 'chicken'} key */
    const kill = key => {
      try {
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        this[key]?.remove()
      } catch {}

      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      delete this[key]
    }

    kill('chestMinecart')
    kill('chicken')
  }
}

const interval = 5
let i = 0
system.runInterval(
  () => {
    i++
    // Perform heavy operations only each 20 ticks
    const canPerformHeavyOperation = i % (20 / interval) === 0
    if (canPerformHeavyOperation) i = 0

    let chestMinecarts
    let chickens

    for (const airdrop of Airdrop.instances) {
      // @ts-expect-error TS(2339) FIXME: Property 'status' does not exist on type 'never'.
      if (airdrop.status === 'falling') {
        // @ts-expect-error TS(2339) FIXME: Property 'teleport' does not exist on type 'never'... Remove this comment to see the full error message
        airdrop.teleport()
        continue
      }

      if (!canPerformHeavyOperation) continue

      chestMinecarts ??= world.overworld.getEntities({
        type: MinecraftEntityTypes.ChestMinecart,
        tags: [Airdrop.minecartTag],
      })
      chickens ??= world.overworld.getEntities({
        type: MinecraftEntityTypes.Chicken,
        tags: [Airdrop.chickenTag],
      })

      // @ts-expect-error TS(2339) FIXME: Property 'status' does not exist on type 'never'.
      if (airdrop.status === 'restoring') {
        try {
          // @ts-expect-error TS(2339) FIXME: Property 'id' does not exist on type 'never'.
          const saved = Airdrop.db[airdrop.id]

          // @ts-expect-error TS(2339) FIXME: Property 'delete' does not exist on type 'never'.
          if (!saved) return airdrop.delete()

          // @ts-expect-error TS(2339) FIXME: Property 'chestMinecart' does not exist on type 'n... Remove this comment to see the full error message
          airdrop.chestMinecart = findAndRemove(chestMinecarts, saved.chest)

          // @ts-expect-error TS(2339) FIXME: Property 'chicken' does not exist on type 'never'.
          airdrop.chicken = findAndRemove(chickens, saved.chicken)
          if (saved.looted) {
            // @ts-expect-error TS(2339) FIXME: Property 'chestMinecart' does not exist on type 'n... Remove this comment to see the full error message
            if (airdrop.chestMinecart?.isValid()) {
              // @ts-expect-error TS(2339) FIXME: Property 'status' does not exist on type 'never'.
              airdrop.status = 'being looted'
              console.debug('Restored looted airdrop')
            }
          } else {
            // @ts-expect-error TS(2339) FIXME: Property 'chicken' does not exist on type 'never'.
            if (airdrop.chicken?.isValid() && airdrop.chestMinecart?.isValid()) {
              console.debug('Restored failling airdrop')

              // @ts-expect-error TS(2339) FIXME: Property 'status' does not exist on type 'never'.
              airdrop.status = 'falling'
            }
          }
        } catch (error) {
          console.error('Failed to restore airdrop')
          util.error(error)
        }
        // @ts-expect-error TS(2339) FIXME: Property 'status' does not exist on type 'never'.
      } else if (airdrop.status === 'being looted') {
        // @ts-expect-error TS(2339) FIXME: Property 'chestMinecart' does not exist on type 'n... Remove this comment to see the full error message
        if (airdrop.chestMinecart) findAndRemove(chestMinecarts, airdrop.chestMinecart.id)

        // Clear empty looted airdrops

        // @ts-expect-error TS(2339) FIXME: Property 'chestMinecart' does not exist on type 'n... Remove this comment to see the full error message
        if (inventoryIsEmpty(airdrop.chestMinecart)) {
          // @ts-expect-error TS(2339) FIXME: Property 'chicken' does not exist on type 'never'.
          if (airdrop.chicken) findAndRemove(chickens, airdrop.chicken.id)

          // @ts-expect-error TS(2339) FIXME: Property 'delete' does not exist on type 'never'.
          airdrop.delete()
        }
      }

      cleanup(chestMinecarts, 'chestMinecart')
      cleanup(chickens, 'chicken')
    }
  },
  'airdrop tp/restore',
  interval,
)

/** @param {Entity | undefined} entity */
export function inventoryIsEmpty(entity) {
  if (!entity?.isValid()) return false

  const { container } = entity
  if (!container) return false // Skip unloaded

  if (container.emptySlotsCount === container.size) return true
}

/**
 * @param {Entity[]} arr
 * @param {'chestMinecart' | 'chicken'} type
 */
function cleanup(arr, type) {
  for (const entity of arr) {
    if (!entity.isValid()) continue

    // @ts-expect-error TS(2339) FIXME: Property 'id' does not exist on type 'never'.
    if (!Airdrop.instances.find(e => e[type]?.id === entity.id)) {
      entity.remove()
    }
  }
}

/**
 * Finds entity in entity array by id and removes it from array
 *
 * @param {Entity[]} arr
 * @param {string} id
 */
const findAndRemove = (arr, id) => {
  const i = arr.findIndex(e => e?.id === id)
  if (i !== -1) return arr.splice(i, 1)[0]
}

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Core'.
Core.afterEvents.worldLoad.subscribe(() => {
  for (const [key, saved] of Object.entries(Airdrop.db)) {
    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const loot = LootTable.instances[saved.loot]

    /** @param {LootTable} loot */

    // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
    const restore = loot => new Airdrop({ loot, for: saved.for }, key)

    if (!loot) {
      LootTable.onNew.subscribe(lootTable => {
        // @ts-expect-error TS(2571) FIXME: Object is of type 'unknown'.
        if (lootTable.id === saved.loot) {
          restore(loot)
        }
      })
    } else {
      restore(loot)
    }
  }
})

actionGuard((player, _region, ctx) => {
  if (ctx.type === 'interactWithEntity') {
    if (ctx.event.target.typeId === MinecraftEntityTypes.ChestMinecart) {
      // @ts-expect-error TS(2339) FIXME: Property 'chestMinecart' does not exist on type 'n... Remove this comment to see the full error message
      const airdrop = Airdrop.instances.find(e => e.chestMinecart?.id === ctx.event.target.id)

      // @ts-expect-error TS(2339) FIXME: Property 'for' does not exist on type 'never'.
      if (airdrop?.for) {
        // Check if airdrop is for specific user

        // @ts-expect-error TS(2339) FIXME: Property 'for' does not exist on type 'never'.
        if (player.id !== airdrop.for) return false
        return true
      } else {
        // Allow interacting with any airdrop by default
        return true
      }
    }
  }
}, -1)
