/** To add boss "minecraft:boss": { "should_darken_sky": false, "hud_range": 25 } */

import { Entity, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { forceAllowSpawnInRegion } from 'lib/region/index'
import { table } from 'lib/database/abstract'
import { EventLoaderWithArg, EventSignal } from 'lib/event-signal'
import { Core } from 'lib/extensions/core'
import { isChunkUnloaded, LocationInDimension } from 'lib/game-utils'
import { location, SafeLocation } from 'lib/location'
import { SphereArea } from 'lib/region/areas/sphere'
import { BossArenaRegion } from 'lib/region/kinds/boss-arena'
import { LootTable } from 'lib/rpg/loot-table'
import { givePlayerMoneyAndXp } from 'lib/rpg/money'
import { Temporary } from 'lib/temporary'
import { t } from 'lib/text'
import { createLogger } from 'lib/utils/logger'
import { Vector } from 'lib/vector'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { FloatingText } from './floating-text'
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
  allowedEntities: string[] | 'all'
  radius: number
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
            allowedEntities: (allowedEntities: string[] | 'all') => ({
              spawnEvent: (spawnEvent: BossOptions['spawnEvent']) => ({
                radius: (radius = 40) =>
                  new Boss({ place, typeId, loot, respawnTime, spawnEvent, allowedEntities, radius }),
              }),
            }),
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

  region?: BossArenaRegion

  location: SafeLocation<Vector3>

  static {
    world.afterEvents.entityDie.subscribe(event => {
      Boss.all.find(e => e.entity?.id === event.deadEntity.id)?.onDie()
    })

    Core.afterEvents.worldLoad.subscribe(() => {
      system.runInterval(() => Boss.all.forEach(e => e.check()), 'boss respawn', 40)
    })

    world.afterEvents.entityHurt.subscribe(event => {
      const boss = Boss.all.find(e => e.entity?.id === event.hurtEntity.id)
      if (!boss) return
      if (!event.damageSource.damagingEntity?.isPlayer()) return

      const prev = boss.damage.get(event.damageSource.damagingEntity) ?? 0
      boss.damage.set(event.damageSource.damagingEntity, prev + event.damage)
    })
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
    this.options.loot.id = `§7${this.options.place.group.id} §fBoss ${this.options.place.id}`

    if (Array.isArray(this.options.allowedEntities))
      this.options.allowedEntities.push(options.typeId, MinecraftEntityTypes.Player)

    this.location = location(options.place)
    this.location.onLoad.subscribe(center => {
      this.check()
      this.region = BossArenaRegion.create(
        new SphereArea({ center, radius: this.options.radius }, this.options.place.group.dimensionId),
        { bossName: this.options.place.name, permissions: { allowedEntities: this.options.allowedEntities } },
      )
      EventLoaderWithArg.load(this.onRegionCreate, this.region)
    })

    Boss.all.push(this)
  }

  readonly onRegionCreate = new EventLoaderWithArg<BossArenaRegion>()

  readonly onEntitySpawn = new EventSignal<Entity>()

  readonly onEntityDie = new EventSignal()

  private logger = createLogger('Boss ' + this.options.place.fullId)

  private damage = new WeakPlayerMap<number>({ removeOnLeave: true })

  get dimensionId() {
    return this.options.place.group.dimensionId
  }

  private onInterval?: (boss: this) => void

  interval(interval: (boss: this) => void) {
    this.onInterval = interval
    return this
  }

  private check() {
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

  private floatingText = new FloatingText(this.options.place.fullId, this.dimensionId)

  private checkRespawnTime(db: BossDB) {
    if (Date.now() > db.date + this.options.respawnTime) {
      this.spawnEntity()
    } else if (this.location.valid) {
      this.floatingText.update(
        Vector.add(this.location, { x: 0, y: 2, z: 0 }),
        `${this.options.place.name}\n${t.time`До появления\n§7осталось ${this.options.respawnTime - (Date.now() - db.date)}`}`,
      )
    }
  }

  private spawnEntity() {
    if (!this.location.valid) return

    // Get type id
    const entityTypeId = this.options.typeId + (this.options.spawnEvent ? '<lw:boss>' : '')
    this.logger.info`Spawn: ${entityTypeId}`

    // Spawn entity
    this.entity = world[this.dimensionId].spawnEntity(entityTypeId, this.location)
    try {
      new Temporary(({ world, cleanup }) => {
        world.afterEvents.entitySpawn.subscribe(({ entity }) => {
          if (entity.id !== this.entity?.id) return

          system.delay(() => {
            if (!this.entity) return

            EventSignal.emit(this.onEntitySpawn, entity)
            this.entity.nameTag = this.options.place.name
          })
          cleanup()
        })
      })
    } catch (e) {
      this.logger.error(e)
    }

    // Save to database
    Boss.db[this.options.place.fullId] = {
      id: this.entity.id,
      date: Date.now(),
      dead: false,
    }
  }

  /** Ensures that entity exists and if not calls onDie method */
  private ensureEntity(db: BossDB) {
    this.entity ??= world[this.dimensionId]
      .getEntities({
        type: this.options.typeId,
        // location: this.location,
        // maxDistance: this.areaRadius,
      })

      .find(e => e.id === db.id)

    if (!this.entity) {
      // Boss died or unloaded, respawn after interval
      this.onDie({ dropLoot: false })
    } else {
      if (
        this.region &&
        this.location.valid &&
        !this.region.area.isVectorIn(this.entity.location, this.entity.dimension.type)
      )
        this.entity.teleport(this.location)

      this.onInterval?.(this)
      this.entity.nameTag = this.options.place.name
      this.floatingText.hide()
    }
  }

  private onDie({ dropLoot = true } = {}) {
    if (!this.location.valid) return

    this.logger.info(
      `Died. Got hits from ${[...this.damage.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => `§l${Player.name(e[0])}§r§f: §6${e[1]}§f`)
        .join(', ')}`,
    )
    EventSignal.emit(this.onEntityDie, undefined)
    const location = this.entity?.isValid() ? this.entity.location : this.location
    delete this.entity

    Boss.db[this.options.place.fullId] = {
      id: '',
      date: Date.now(),
      dead: true,
    }

    if (dropLoot) {
      world.say(`§6Убит босс §f${this.options.place.name}!`)

      this.options.loot.generate().forEach(e => {
        if (e) {
          const item = world[this.dimensionId].spawnItem(e, location)
          forceAllowSpawnInRegion(item)
        }
      })
      const players = world.getAllPlayers()

      for (const [playerId, damage] of this.damage) {
        const player = players.find(e => e.id === playerId)
        if (!player) return

        givePlayerMoneyAndXp(player, ~~damage * 2, ~~(damage / 50))
      }
      this.damage.clear()
    }
  }
}
