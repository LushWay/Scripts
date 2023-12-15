import { Vector, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data.js'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { LootTable } from './LootTable.js'

const AIRDROP_DB = new DynamicPropertyDB('airdrop', {
  /**
   * @type {Record<string, {chicken: string, chest: string, loot: string, lootTableAir: Percent}>}
   */
  type: {},
}).proxy()

export class Airdrop {
  static chestOffset = { x: 0, y: -2, z: 0 }

  /** @type {Airdrop[]} */
  static instances = []

  active = false

  /**
   * @param {({position: Vector3, spawn: true} | {position?: undefined, spawn: false}) & {loot: LootTable, lootTableAir: Percent}} options
   */
  constructor(options, key = new Date().toISOString()) {
    this.lootTable = options.loot
    this.airPercent = options.lootTableAir
    this.key = key

    if (options.spawn) this.spawn(options.position)
    Airdrop.instances.push(this)
  }
  /**
   * @param {Vector3} position
   */
  spawn(position) {
    this.chicken = world.overworld.spawnEntity(
      MinecraftEntityTypes.Chicken + '<chicken:drop>',
      position
    )
    this.chestMinecart = world.overworld.spawnEntity(
      MinecraftEntityTypes.ChestMinecart + '<chest_minecart:drop>',
      Vector.add(position, Airdrop.chestOffset)
    )
    AIRDROP_DB[this.key] = {
      chest: this.chestMinecart.id,
      chicken: this.chicken.id,
      loot: this.lootTable.key,
      lootTableAir: this.airPercent,
    }
    this.active = true
  }
  restore() {
    const data = AIRDROP_DB[this.key]
    this.chestMinecart = world.overworld
      .getEntities({
        type: MinecraftEntityTypes.ChestMinecart,
      })
      .find(e => e.id === data.chest)
    this.chicken = world.overworld
      .getEntities({
        type: MinecraftEntityTypes.Chicken,
      })
      .find(e => e.id === data.chicken)
    this.active = true
  }
  fillChest() {
    if (!this.chestMinecart) return
    this.lootTable.fillContainer(
      this.chestMinecart.getComponent('inventory').container,
      this.airPercent
    )
  }
  teleport() {
    if (!this.chestMinecart || !this.chicken) return
    this.chestMinecart.teleport(
      Vector.add(this.chicken.location, Airdrop.chestOffset)
    )
  }
}

system.runInterval(
  () => {
    for (const airdrop of Airdrop.instances) {
      if (!airdrop.active) {
        try {
          airdrop.restore
        } catch {}
      } else {
        airdrop.teleport()
      }
    }
  },
  'airdrop tp/restore',
  10
)

world.afterEvents.dataDrivenEntityTriggerEvent.subscribe(
  event => {
    const airdrop = Airdrop.instances.find(
      e => e.chestMinecart?.id === event.entity.id
    )
    if (airdrop) {
      airdrop.fillChest()
      airdrop.chicken?.remove()
    }
  },
  {
    entityTypes: [MinecraftEntityTypes.ChestMinecart],
    eventTypes: ['chest_minecart:ground'],
  }
)

SM.afterEvents.worldLoad.subscribe(() => {
  for (const [key, data] of Object.entries(AIRDROP_DB))
    new Airdrop(
      {
        spawn: false,
        loot: LootTable.instances[data.loot],
        lootTableAir: data.lootTableAir,
      },
      key
    )
})
