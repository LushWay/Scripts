/**
 * To add boss
 * "minecraft:boss": {
    "should_darken_sky": false,
    "hud_range": 25
}
 */

import { LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'
import { EditableLocation } from 'smapi.js'

/**
 * @typedef {{
 *  id: string;
 *  date: number;
 *  dead: boolean;
 *}} BossDB
 */

const BOSS_DB = new DynamicPropertyDB('boss', {
  /**
   * @type {Record<string, BossDB | undefined>}
   */
  type: {},
}).proxy()

export class Boss {
  /**
   * @type {Boss[]}
   */
  static instances = []
  /**
   * @param {object} o
   * @param {string} o.name Script id used for location
   * @param {string} o.entityId
   * @param {string} o.displayName
   * @param {number} o.respawnTime In ms
   * @param {boolean} [o.bossEvent]
   */
  constructor({ name, entityId, displayName, respawnTime, bossEvent = true }) {
    this.name = name
    this.entityId = entityId
    this.displayName = displayName
    this.respawnTime = respawnTime
    this.bossEvent = bossEvent
    this.location = new EditableLocation('boss_' + name + '_spawn_pos')

    // Without delay any error causes module to stop loading
    // so none of intervals would work.
    system.delay(() => this.location.onValid.subscribe(() => this.check()))

    Boss.instances.push(this)
  }

  check() {
    // Make sure that the location is loaded
    try {
      const block = world.overworld.getBlock(this.location)
      if (!block) return
    } catch (error) {
      if (error instanceof LocationInUnloadedChunkError) {
        return
      } else throw error
    }

    const db = BOSS_DB[this.name]
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
    const entityId = this.entityId + (this.bossEvent ? '<sm:boss>' : '')
    console.debug(`Boss(${this.name}).spawnEntity(${entityId})`)
    this.entity = world.overworld.spawnEntity(entityId, this.location)
    BOSS_DB[this.name] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /**
   * @param {BossDB} db
   */
  ensureEntity(db) {
    const entity = world.overworld
      .getEntities({
        type: this.entityId,
        // location: this.location,
        // maxDistance: 50,
      })
      .find(e => e.id === db.id)

    if (!entity) {
      // Boss went out of location, respawn after interval
      this.onDie({ dropLoot: false })
    }
    this.entity = entity
  }

  onDie({ dropLoot = true } = {}) {
    console.debug(`Boss(${this.name}).onDie`)
    delete this.entity
    BOSS_DB[this.name] = {
      id: '',
      date: Date.now(),
      dead: true,
    }

    if (dropLoot) {
      world.say('Убит босс ' + this.displayName)
      // Do nothing rn
    }
  }
}

world.afterEvents.entityDie.subscribe(data => {
  Boss.instances.find(e => e.entity?.id === data.deadEntity.id)?.onDie()
})

system.runInterval(
  () => {
    Boss.instances.forEach(e => e.location.valid && e.check())
  },
  'boss respawn',
  40
)
