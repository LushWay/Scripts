/**
 * To add boss
 * "minecraft:boss": {
    "should_darken_sky": false,
    "hud_range": 25
}
 */

import { system, world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { LootTable } from 'lib/LootTable.js'
import { BossArenaRegion } from 'lib/Region/index.js'
import { EditableLocation } from './EditableLocation.js'
import { chunkIsUnloaded } from './GameUtils.js'

/**
 * @typedef {{
 *  id: string;
 *  date: number;
 *  dead: boolean;
 *}} BossDB
 */

export class Boss {
  static db = new DynamicPropertyDB('boss', {
    /**
     * @type {Record<string, BossDB | undefined>}
     */
    type: {},
  }).proxy()
  /**
   * @type {Boss[]}
   */
  static instances = []
  /**
   * @param {object} o
   * @param {string} o.name Script id used for location
   * @param {string} o.entityTypeId
   * @param {string} o.displayName
   * @param {number} o.respawnTime In ms
   * @param {boolean} [o.bossEvent]
   * @param {number} [o.arenaRadius]
   * @param {LootTable} o.loot
   * @param {Dimensions} [o.dimensionId]
   */
  constructor({
    name,
    entityTypeId,
    displayName,
    respawnTime,
    bossEvent = true,
    arenaRadius = 10,
    dimensionId = 'overworld',
    loot,
  }) {
    this.name = name
    this.dimensionId = dimensionId
    this.entityTypeId = entityTypeId
    this.displayName = displayName
    this.respawnTime = respawnTime
    this.bossEvent = bossEvent
    this.loot = loot
    this.location = new EditableLocation('Босс ' + name).safe
    this.arenaRadius = arenaRadius

    // Without delay any error during loading
    // caused this file to stop loading
    // so none of intervals would work.
    system.delay(() => {
      this.location.onLoad.subscribe(center => {
        this.check()
        this.region = new BossArenaRegion({
          center,
          radius: this.arenaRadius,
          dimensionId: this.dimensionId,
        })
      })
    })

    Boss.instances.push(this)
  }

  check() {
    if (!this.location.valid) return
    if (chunkIsUnloaded({ dimensionId: this.dimensionId, location: this.location })) return

    const db = Boss.db[this.name]
    if (db) {
      if (db.dead) {
        // After death interval
        this.checkRespawnTime(db)
      } else {
        this.ensureEntity(db)
      }
    } else {
      // First time spawn
      this.spawnEntity()
    }
  }

  /**
   * @param {BossDB} db
   */
  checkRespawnTime(db) {
    if (Date.now() > db.date + this.respawnTime) this.spawnEntity()
  }

  spawnEntity() {
    if (!this.location.valid) return
    const entityTypeId = this.entityTypeId + (this.bossEvent ? '<sm:boss>' : '')
    console.debug(`Boss(${this.name}).spawnEntity(${entityTypeId})`)
    this.entity = world[this.dimensionId].spawnEntity(entityTypeId, this.location)
    Boss.db[this.name] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /**
   * @param {BossDB} db
   */
  ensureEntity(db) {
    const entity = world[this.dimensionId]
      .getEntities({
        type: this.entityTypeId,
        // location: this.location,
        // maxDistance: this.areaRadius,
      })
      .find(e => e.id === db.id)

    if (!entity) {
      // Boss went out of location or in unloaded chunk, respawn after interval
      this.onDie({ dropLoot: false })
    }
    this.entity = entity
  }

  onDie({ dropLoot = true } = {}) {
    if (!this.location.valid) return
    console.debug(`Boss(${this.name}).onDie()`)
    const location = this.entity?.isValid() ? this.entity.location : this.location
    delete this.entity
    Boss.db[this.name] = {
      id: '',
      date: Date.now(),
      dead: true,
    }

    if (dropLoot) {
      world.say('§6Убит босс §f' + this.displayName + '!')
      this.loot.generate().forEach(e => e && world[this.dimensionId].spawnItem(e, location))
      // TODO Give money depending on how many hits etc
    }
  }
}

world.afterEvents.entityDie.subscribe(data => {
  Boss.instances.find(e => e.entity?.id === data.deadEntity.id)?.onDie()
})

system.runInterval(
  () => {
    Boss.instances.forEach(e => e.check())
  },
  'boss respawn',
  40
)
