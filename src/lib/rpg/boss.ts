/** To add boss "minecraft:boss": { "should_darken_sky": false, "hud_range": 25 } */

import { Entity, system, world } from '@minecraft/server'
import { table } from 'lib/database/abstract'
import { isChunkUnloaded, LocationInDimension } from 'lib/game-utils'
import { location, SafeLocation } from 'lib/location'
import { Region } from 'lib/region/index'
import { BossArenaRegion } from 'lib/region/kinds/boss-arena'
import { LootTable } from 'lib/rpg/loot-table'
import { Group, Place } from './place'

interface BossDB {
  id: string
  date: number
  dead: boolean
}

interface BossOptions {
  place: Place
  typeId: string
  loot: LootTable
  spawnEvent: boolean | string
  respawnTime: number
}

export class Boss {
  /** Boss Database. Contains meta information about spawned boss entities */
  static db = table<BossDB>('boss')

  /** List of all registered boss types */
  static all: Boss[] = []

  static create() {
    return Group.pointCreator(place => ({
      typeId: (typeId: string) => ({
        loot: (loot: LootTable) => ({
          respawnTime: (respawnTime: number) => ({
            spawnEvent: (spawnEvent: BossOptions['spawnEvent']) =>
              new Boss({ place, typeId, loot, respawnTime, spawnEvent }),
          }),
        }),
      }),
    }))
  }

  static isBoss(entityOrId: Entity | string) {
    const id = entityOrId instanceof Entity ? entityOrId.id : entityOrId

    return this.all.some(e => e.entity?.id === id)
  }

  entity: Entity | undefined

  region?: Region

  location: SafeLocation<Vector3>

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
  constructor(private options: BossOptions) {
    this.location = location(options.place)
    this.location.onLoad.subscribe(center => {
      this.check()
      this.region = BossArenaRegion.create({
        center,
        radius: 40,
        dimensionId: this.options.place.group.dimensionId,
        bossName: this.options.place.name,
      })
    })

    Boss.all.push(this)
  }

  get dimensionId() {
    return this.options.place.group.dimensionId
  }

  check() {
    if (!this.location.valid) return
    if (isChunkUnloaded(this as LocationInDimension)) return

    const db = Boss.db[this.options.place.fullId]
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
    if (Date.now() > db.date + this.options.respawnTime) this.spawnEntity()
  }

  spawnEntity() {
    if (!this.location.valid) return

    // Get type id
    const entityTypeId = this.options.typeId + (this.options.spawnEvent ? '<lw:boss>' : '')
    console.debug(`Boss(${this.options.place.fullId}).spawnEntity(${entityTypeId})`)

    // Spawn entity
    this.entity = world[this.dimensionId].spawnEntity(entityTypeId, this.location)
    try {
      this.entity.nameTag = this.options.place.name
    } catch (e) {
      console.error(e)
    }

    // Save to database
    Boss.db[this.options.place.fullId] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /** Ensures that entity exists and if not calls onDie method */
  ensureEntity(db: BossDB) {
    const entity = world[this.dimensionId]
      .getEntities({
        type: this.options.typeId,
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
    console.debug(`Boss(${this.options.place.fullId}).onDie()`)
    const location = this.entity?.isValid() ? this.entity.location : this.location
    delete this.entity

    Boss.db[this.options.place.fullId] = {
      id: '',
      date: Date.now(),
      dead: true,
    }

    if (dropLoot) {
      world.say('§6Убит босс §f' + this.options.place.name + '!')

      this.options.loot.generate().forEach(e => e && world[this.dimensionId].spawnItem(e, location))
      // TODO Give money depending on how many hits etc
    }
  }
}
