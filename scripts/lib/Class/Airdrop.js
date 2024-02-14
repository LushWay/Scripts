import { Entity, Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { util } from 'lib/util.js'
import { GAME_UTILS } from './GameUtils.js'
import { LootTable } from './LootTable.js'

const AIRDROP_DB = new DynamicPropertyDB('airdrop', {
  /**
   * @type {Record<string, { chicken: string, chest: string, loot: string, for?: string }>}
   */
  type: {},
}).proxy()

export class Airdrop {
  static minecartTag = 'chest_minecart:loot'
  static chestOffset = { x: 0, y: -4, z: 0 }

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
      for: this.for,
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
    const saved = AIRDROP_DB[this.key]
    if (!saved) return this.delete()
    this.chestMinecart = chestMinecarts.find(e => e?.id === saved.chest)
    this.chicken = chickens.find(e => e?.id === saved.chicken)
    this.active = 'falling'
  }
  teleport() {
    if (!this.chestMinecart || !this.chicken) return
    const location = GAME_UTILS.safeGet(this.chicken, 'location')
    if (!location) return this.delete()

    this.chestMinecart.teleport(Vector.add(location, Airdrop.chestOffset))
    if (!this.chestMinecart.dimension.getBlock(this.chestMinecart.location)?.below()?.isAir) {
      this.chestMinecart.triggerEvent('chest_minecart:ground')
      if (this.chestMinecart.container) this.lootTable.fillContainer(this.chestMinecart.container)
      this.chicken.remove()
      this.status = 'being looted'
    }
  }
  delete() {
    Airdrop.instances = Airdrop.instances.filter(e => e !== this)
    Reflect.deleteProperty(AIRDROP_DB, this.key)

    if (this.chestMinecart)
      try {
        this.chestMinecart.remove()
      } catch {}

    delete this.chestMinecart

    if (this.chicken)
      try {
        this.chicken.remove()
      } catch {}

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
        const { container } = airdrop.chestMinecart
        if (!container) continue
        if (container.emptySlotsCount === container.size) {
          airdrop.delete()
        }
      }
    }

    // Clear empty loot minecarts
    for (const chestMinecart of chestMinecarts.filter(
      // Exclude failling minecarts cuz they will not have
      // any item inside and its how it should work
      e => !Airdrop.instances.find(i => i.chestMinecart?.id !== e.id)
    )) {
      const { container } = chestMinecart
      if (!container) continue
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
