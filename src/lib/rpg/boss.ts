/** To add boss "minecraft:boss": { "should_darken_sky": false, "hud_range": 25 } */

import { Entity, system, world } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { isChunkUnloaded } from 'lib/game-utils'
import { location, migrateLocationName } from 'lib/location'
import { Region } from 'lib/region/index'
import { BossArenaRegion } from 'lib/region/kinds/BossArenaRegion'
import { LootTable } from 'lib/rpg/loot-table'

interface BossDB {
  id: string
  date: number
  dead: boolean
}

export class Boss {
  /** Boss Database. Contains meta information about spawned boss entities */
  static db = table<BossDB>('boss')

  /** List of all registered boss types */
  static all: Boss[] = []

  arenaRadius

  bossEvent

  dimensionId

  name

  entity: Entity | undefined

  entityTypeId

  location

  loot

  id

  region: Region

  respawnTime

  static {
    world.afterEvents.entityDie.subscribe(data => {
      Boss.all.find(e => e.entity?.id === data.deadEntity.id)?.onDie()
    })

    system.runInterval(() => Boss.all.forEach(e => e.check()), 'boss respawn', 40)
  }

  /**
   * Creates a new boss
   *
   * @param {object} o
   * @param o.group Group id used for location
   * @param o.name Unique id used for location
   * @param o.respawnTime In ms
   */
  constructor({
    group,
    id,
    entityTypeId,
    name,
    respawnTime,
    bossEvent = true,
    arenaRadius = 10,
    dimensionId = 'overworld',
    loot,
  }: {
    group: string
    id: string
    entityTypeId: string
    name: string
    respawnTime: number
    bossEvent?: boolean
    arenaRadius?: number
    loot: LootTable
    dimensionId?: Dimensions
  }) {
    this.id = id
    this.entityTypeId = entityTypeId
    this.dimensionId = dimensionId
    this.name = name
    this.respawnTime = respawnTime
    this.bossEvent = bossEvent
    this.loot = loot

    migrateLocationName('Боссы', id, group, id)
    this.location = location(group, id, name)
    this.arenaRadius = arenaRadius
    this.location.onLoad.subscribe(center => {
      this.check()
      this.region = BossArenaRegion.create({
        center,
        radius: this.arenaRadius,
        dimensionId: this.dimensionId,
      })
    })

    Boss.all.push(this)
  }

  check() {
    if (!this.location.valid) return
    if (isChunkUnloaded({ dimensionId: this.dimensionId, location: this.location })) return

    const db = Boss.db[this.id]
    if (typeof db !== 'undefined') {
      if (db.dead) {
        this.checkRespawnTime(db)
      } else {
        this.ensureEntity(db)
      }
    } else {
      // First time spawn
      this.spawnEntity()
    }
  }

  checkRespawnTime(db: BossDB) {
    if (Date.now() > db.date + this.respawnTime) this.spawnEntity()
  }

  spawnEntity() {
    if (!this.location.valid) return

    // Get type id
    const entityTypeId = this.entityTypeId + (this.bossEvent ? '<sm:boss>' : '')
    console.debug(`Boss(${this.id}).spawnEntity(${entityTypeId})`)

    // Spawn entity
    this.entity = world[this.dimensionId].spawnEntity(entityTypeId, this.location)

    // Save to database
    Boss.db[this.id] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /** Ensures that entity exists and if not calls onDie method */
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
    console.debug(`Boss(${this.id}).onDie()`)
    const location = this.entity?.isValid() ? this.entity.location : this.location
    delete this.entity

    Boss.db[this.id] = {
      id: '',
      date: Date.now(),
      dead: true,
    }

    if (dropLoot) {
      world.say('§6Убит босс §f' + this.name + '!')

      this.loot.generate().forEach(e => e && world[this.dimensionId].spawnItem(e, location))
      // TODO Give money depending on how many hits etc
    }
  }
}
