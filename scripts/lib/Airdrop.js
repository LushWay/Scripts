import { Entity, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { actionGuard } from 'lib/Region/index.js'
import { util } from 'lib/util.js'
import { invalidLocation } from './GameUtils.js'
import { LootTable } from './LootTable.js'
import { Temporary } from './Temporary.js'

export class Airdrop {
  static db = new DynamicPropertyDB('airdrop', {
    /**
     * @type {Record<string, { chicken: string, chest: string, loot: string, for?: string, looted?: true }>}
     */
    type: {},
  }).proxy()
  static minecartTag = 'chest_minecart:loot'
  static chickenTag = 'chicken:loot'
  static chestOffset = { x: 0, y: -2, z: 0 }

  /** @type {Airdrop[]} */
  static instances = []

  /**
   * @type {'restoring' | 'falling' | 'being looted'}
   */
  status = 'restoring'

  /**
   * @param {{ position?: Vector3, loot: LootTable, for?: string }} options
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

    Airdrop.instances.push(this)
  }
  /**
   * Spawns airdrop at the given position
   * @param {Vector3} position - Position to spawn airdrop on
   */
  spawn(position) {
    console.debug('spawning airdrop at', Vector.string(Vector.floor(position), true))

    this.chicken = world.overworld.spawnEntity('minecraft:chicken<chicken:drop>', position)
    this.chestMinecart = world.overworld.spawnEntity(
      'minecraft:chest_minecart<chest_minecart:drop>',
      Vector.add(position, Airdrop.chestOffset)
    )

    let chest = false
    let chicken = false
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

    /** @param {'chestMinecart' | 'chicken'} key  */
    const kill = key => {
      try {
        this[key]?.remove()
      } catch {}

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
      if (airdrop.status === 'falling') {
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

      if (airdrop.status === 'restoring') {
        try {
          const saved = Airdrop.db[airdrop.id]
          if (!saved) return airdrop.delete()

          airdrop.chestMinecart = findAndRemove(chestMinecarts, saved.chest)
          airdrop.chicken = findAndRemove(chickens, saved.chicken)
          if (saved.looted) {
            if (airdrop.chestMinecart?.isValid()) {
              airdrop.status = 'being looted'
              console.debug('Restored looted airdrop')
            }
          } else {
            if (airdrop.chicken?.isValid() && airdrop.chestMinecart?.isValid()) {
              console.debug('Restored failling airdrop')
              airdrop.status = 'falling'
            }
          }
        } catch (error) {
          console.error('Failed to restore airdrop')
          util.error(error)
        }
      } else if (airdrop.status === 'being looted') {
        if (airdrop.chestMinecart) findAndRemove(chestMinecarts, airdrop.chestMinecart.id)

        // Clear empty looted airdrops
        if (inventoryIsEmpty(airdrop.chestMinecart)) {
          if (airdrop.chicken) findAndRemove(chickens, airdrop.chicken.id)
          airdrop.delete()
        }
      }

      cleanup(chestMinecarts, 'chestMinecart')
      cleanup(chickens, 'chicken')
    }
  },
  'airdrop tp/restore',
  interval
)

/**
 * @param {Entity | undefined} entity
 */
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
    if (!Airdrop.instances.find(e => e[type]?.id === entity.id)) {
      entity.remove()
    }
  }
}

/**
 * Finds entity in entity array by id and removes it from array
 * @param {Entity[]} arr
 * @param {string} id
 */
const findAndRemove = (arr, id) => {
  const i = arr.findIndex(e => e?.id === id)
  if (i !== -1) return arr.splice(i, 1)[0]
}

Core.afterEvents.worldLoad.subscribe(() => {
  for (const [key, saved] of Object.entries(Airdrop.db)) {
    const loot = LootTable.instances[saved.loot]

    /** @param {LootTable} loot */
    const restore = loot => new Airdrop({ loot, for: saved.for }, key)

    if (!loot) {
      LootTable.onNew.subscribe(lootTable => {
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
      const airdrop = Airdrop.instances.find(e => e.chestMinecart?.id === ctx.event.target.id)
      if (airdrop?.for) {
        // Check if airdrop is for specific user
        if (player.id !== airdrop.for) return false
        return true
      } else {
        // Allow interacting with any airdrop by default
        return true
      }
    }
  }
}, -1)
