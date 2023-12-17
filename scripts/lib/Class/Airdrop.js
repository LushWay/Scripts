import { Entity, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { EventSignal } from './EventSignal.js'
import { GAME_UTILS } from './GameUtils.js'
import { LootTable } from './LootTable.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'lib/util.js'

const AIRDROP_DB = new DynamicPropertyDB('airdrop', {
  /**
   * @type {Record<string, { chicken: string, chest: string, loot: string }>}
   */
  type: {},
}).proxy()

export class Airdrop {
  /**
   * @type {EventSignal<{minecart: Entity, airdrop: Airdrop}>}
   */
  static emptyMinecartRemove = new EventSignal()
  /**
   * @param {Entity} minecart
   * @param {Airdrop} [airdrop]
   */
  static minecartIsEmpty(minecart, airdrop) {
    const { container } = minecart.getComponent('inventory')
    if (container.size === container.emptySlotsCount) {
      minecart.remove()
      if (airdrop) {
        EventSignal.emit(this.emptyMinecartRemove, { minecart, airdrop })
      }
    }
  }
  static minecartTag = 'chest_minecart:loot'
  static chestOffset = { x: 0, y: -2, z: 0 }

  /** @type {Airdrop[]} */
  static instances = []

  /**
   * @type {'restoring' | 'falling' | 'being looted'}
   */
  status = 'restoring'

  /**
   * @param {{ position?: Vector3, loot: LootTable }} options
   * @param {string} [key]
   */
  constructor(options, key) {
    this.lootTable = options.loot
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
    console.debug('spawning airdrop at', Vector.string(Vector.floor(position)))
    this.chicken = world.overworld.spawnEntity('minecraft:chicken<chicken:drop>', position)
    console.debug('spawned chicken')
    this.chestMinecart = world.overworld.spawnEntity(
      'minecraft:chest_minecart<chest_minecart:drop>',
      Vector.add(position, Airdrop.chestOffset)
    )
    console.debug('spawned chest minecart')
    this.chestMinecart.addTag(Airdrop.minecartTag)
    AIRDROP_DB[this.key] = {
      chest: this.chestMinecart.id,
      chicken: this.chicken.id,
      loot: this.lootTable.key,
    }
    this.status = 'falling'
  }
  /**
   * @param {{chestMinecarts: Entity[], chickens: Entity[]}} param0
   */
  restore({ chestMinecarts, chickens }) {
    const data = AIRDROP_DB[this.key]
    if (!data) return this.delete()
    this.chestMinecart = chestMinecarts.find(e => e.id === data.chest)
    this.chicken = chickens.find(e => e.id === data.chicken)
    this.active = 'falling'
  }
  teleport() {
    if (!this.chestMinecart || !this.chicken) return
    const location = GAME_UTILS.safeGet(this.chicken, 'location')
    if (!location) return this.delete()

    this.chestMinecart.teleport(Vector.add(location, Airdrop.chestOffset))
    if (!this.chestMinecart.dimension.getBlock(this.chestMinecart.location)?.below()?.isAir) {
      this.chestMinecart.triggerEvent('chest_minecart:ground')
      this.lootTable.fillContainer(this.chestMinecart.getComponent('inventory').container)
      this.chicken.remove()
      this.status = 'being looted'
    }
  }
  delete() {
    Airdrop.instances = Airdrop.instances.filter(e => e !== this)
    Reflect.deleteProperty(AIRDROP_DB, this.key)
    delete this.chestMinecart
    delete this.chicken
  }
}

system.runInterval(
  () => {
    const chestMinecarts = world.overworld.getEntities({
      type: MinecraftEntityTypes.ChestMinecart,
      tags: [Airdrop.minecartTag],
    })
    let chickens

    for (const airdrop of Airdrop.instances) {
      if (airdrop.status === 'restoring') {
        try {
          chickens ??= world.overworld.getEntities({
            type: MinecraftEntityTypes.Chicken,
          })
          airdrop.restore({
            chestMinecarts,
            chickens,
          })
        } catch (e) {
          util.error(e)
        }
      } else if (airdrop.status === 'falling') {
        airdrop.teleport()
      } else if (airdrop.status === 'being looted' && airdrop.chestMinecart) {
        const { container } = airdrop.chestMinecart.getComponent('inventory')
        if (container.emptySlotsCount === container.size) airdrop.chestMinecart.remove()
      }
    }

    // Clear empty loot minecarts
    for (const chestMinecart of chestMinecarts.filter(
      // Exclude failling minecarts cuz they will not have
      // any item inside and its how it should work
      e => !Airdrop.instances.find(i => i.chestMinecart?.id !== e.id)
    )) {
      const { container } = chestMinecart.getComponent('inventory')
      if (container.emptySlotsCount === container.size) chestMinecart.remove()
    }
  },
  'airdrop tp/restore',
  10
)

SM.afterEvents.worldLoad.subscribe(() => {
  for (const [key, data] of Object.entries(AIRDROP_DB))
    new Airdrop(
      {
        loot: LootTable.instances[data.loot],
      },
      key
    )
})
