/** To add boss "minecraft:boss": { "should_darken_sky": false, "hud_range": 25 } */

import { Entity, system, world } from '@minecraft/server'
import { LootTable } from 'lib/LootTable'
import { BossArenaRegion, Region } from 'lib/region/index'
import { EditableLocation } from './EditableLocation'
import { chunkIsUnloaded } from './GameUtils'
import { table } from './database/abstract'

type BossDB = {
  id: string
  date: number
  dead: boolean
}

export class Boss {
  /** Boss Database. Contains meta information about spawned boss entities */
  static db = table<BossDB>('boss')

  /**
   * List of all registered boss types
   *
   * @type {Boss[]}
   */
  static types: Boss[] = []

  arenaRadius

  bossEvent

  dimensionId

  displayName

  entity: Entity | undefined

  entityTypeId

  location

  loot

  name

  region: Region

  respawnTime

  static {
    world.afterEvents.entityDie.subscribe(data => {
      Boss.types.find(e => e.entity?.id === data.deadEntity.id)?.onDie()
    })

    system.runInterval(() => Boss.types.forEach(e => e.check()), 'boss respawn', 40)
  }

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
  }: {
    name: string
    entityTypeId: string
    displayName: string
    respawnTime: number
    bossEvent?: boolean
    arenaRadius?: number
    loot: LootTable
    dimensionId?: Dimensions
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
    // so none of intervals would register.
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

    Boss.types.push(this)
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

  /** @param {BossDB} db */

  checkRespawnTime(db: BossDB) {
    if (Date.now() > db.date + this.respawnTime) this.spawnEntity()
  }

  spawnEntity() {
    if (!this.location.valid) return

    // Get type id
    const entityTypeId = this.entityTypeId + (this.bossEvent ? '<sm:boss>' : '')

    // Log
    console.debug(`Boss(${this.name}).spawnEntity(${entityTypeId})`)

    // Spawn entity
    this.entity = world[this.dimensionId].spawnEntity(entityTypeId, this.location)

    // Save to database

    Boss.db[this.name] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /**
   * Ensures that entity exists and if not calls onDie method
   *
   * @param {BossDB} db
   */

  ensureEntity(db: BossDB) {
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
