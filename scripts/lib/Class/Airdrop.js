import {
  Dimension,
  Entity,
  LocationInUnloadedChunkError,
  LocationOutOfWorldBoundariesError,
  Vector,
  system,
  world,
} from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'lib/util.js'
import { LootTable } from './LootTable.js'
import { Temporary } from './Temporary.js'

const AIRDROP_DB = new DynamicPropertyDB('airdrop', {
  /**
   * @type {Record<string, { chicken: string, chest: string, loot: string, for?: string, looted?: true }>}
   */
  type: {},
}).proxy()

export class Airdrop {
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
   * @param {string} [key]
   */
  constructor(options, key) {
    this.lootTable = options.loot
    this.for = options.for
    this.key = key

    if (!this.key) {
      this.key = new Date().toISOString()
      if (options.position) this.spawn(options.position)
    }

    Airdrop.instances.push(this)
  }
  /**
   * @param {Vector3} position
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
      console.debug('Loading loot table', this.lootTable ? this.lootTable.key : 'NO NAME')
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

    AIRDROP_DB[this.key] = {
      for: this.for,
      chest: this.chestMinecart.id,
      chicken: this.chicken.id,
      loot: this.lootTable.key,
      ...(this.status === 'being looted' ? { looted: true } : {}),
    }
  }

  /**
   * Shows particle trace under chest minecart
   * @param {Vector3} [from]
   */
  async showParticleTrace(from) {
    if (!from && this.chestMinecart && this.chestMinecart.isValid()) {
      from = Vector.floor(this.chestMinecart.location)
    }

    if (from) {
      let { x, z } = from
      x -= 0.4
      z -= 0.3

      // eslint-disable-next-line for-direction
      for (let y = from.y; y > from.y - 10; y--) {
        try {
          world.overworld.spawnParticle('minecraft:balloon_gas_particle', { x, y, z })
          await nextTick
        } catch (error) {
          if (error instanceof LocationInUnloadedChunkError || error instanceof LocationOutOfWorldBoundariesError)
            continue
          util.error(error)
        }
      }
    }
  }

  delete() {
    Airdrop.instances = Airdrop.instances.filter(e => e !== this)
    Reflect.deleteProperty(AIRDROP_DB, this.key)

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
          const saved = AIRDROP_DB[airdrop.key]
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
        if (airdrop.chestMinecart?.isValid()) {
          // Clear empty looted airdrops
          const { container } = airdrop.chestMinecart
          if (!container) continue // Skip unloaded
          if (container.emptySlotsCount === container.size) {
            airdrop.delete()
          }
        }

        if (airdrop.chicken) {
          findAndRemove(chickens, airdrop.chicken.id)
        }
      }

      // Cleanup
      /**
       * @param {Entity[]} arr
       * @param {'chestMinecart' | 'chicken'} type
       */
      const cleanup = (arr, type) => {
        for (const chest of arr) {
          if (!chest.isValid()) continue
          if (!Airdrop.instances.find(e => e[type]?.id === chest.id)) {
            chest.remove()
          }
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
 * Finds entity in entity array by id and removes it
 * @param {Entity[]} arr
 * @param {string} id
 */
const findAndRemove = (arr, id) => {
  const i = arr.findIndex(e => e?.id === id)
  if (i !== -1) return arr.splice(i, 1)[0]
}

SM.afterEvents.worldLoad.subscribe(() => {
  for (const [key, saved] of Object.entries(AIRDROP_DB)) {
    const loot = LootTable.instances[saved.loot]

    /** @param {LootTable} loot */
    const restore = loot => new Airdrop({ loot }, key)

    if (!loot) {
      LootTable.onNew.subscribe(lootTable => {
        if (lootTable.key === saved.loot) {
          restore(loot)
        }
      })
    } else {
      restore(loot)
    }
  }
})

/** @type {Set<{dimension: Dimension, id: string, location: Vector3}>} */
const removedEntities = new Set()

world.beforeEvents.entityRemove.subscribe(event => {
  if (
    event.removedEntity.hasTag(Airdrop.minecartTag) &&
    event.removedEntity.typeId === MinecraftEntityTypes.ChestMinecart
  ) {
    removedEntities.add({
      dimension: event.removedEntity.dimension,
      location: event.removedEntity.location,
      id: event.removedEntity.id,
    })
  }
})

world.afterEvents.entityDie.subscribe(
  event => {
    for (const entity of removedEntities) {
      if (entity.id === event.deadEntity.id) {
        entity.dimension
          .getEntities({
            location: entity.location,
            maxDistance: 2,
            type: 'minecraft:item',
          })
          .forEach(e => e.isValid() && e.remove())

        removedEntities.delete(entity)
      }
    }
  },
  { entityTypes: [MinecraftEntityTypes.ChestMinecart] }
)
