/** To add boss "minecraft:boss": { "should_darken_sky": false, "hud_range": 25 } */

import { Entity, Player, system, world } from '@minecraft/server'
import { MinecraftEntityTypes } from '@minecraft/vanilla-data'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { defaultLang } from 'lib/assets/lang'
import { table } from 'lib/database/abstract'
import { EventLoaderWithArg, EventSignal } from 'lib/event-signal'
import { Core } from 'lib/extensions/core'
import { i18n, i18nShared } from 'lib/i18n/text'
import { ConfigurableLocation, location } from 'lib/location'
import { Area, AreaAsJson } from 'lib/region/areas/area'
import { SphereArea } from 'lib/region/areas/sphere'
import { forceAllowSpawnInRegion } from 'lib/region/index'
import { BossArenaRegion } from 'lib/region/kinds/boss-arena'
import { LootTable } from 'lib/rpg/loot-table'
import { givePlayerMoneyAndXp } from 'lib/rpg/money'
import { Temporary } from 'lib/temporary'
import { getBlockStatus } from 'lib/utils/game'
import { createLogger } from 'lib/utils/logger'
import { Vec } from 'lib/vector'
import { WeakPlayerMap } from 'lib/weak-player-storage'
import { FloatingText } from './floating-text'
import { Group, Place } from './place'

interface BossDB {
  id: string
  date: number
  dead: boolean
}

interface BossArenaDB {
  area: AreaAsJson
  ldb?: JsonObject
}

interface BossOptions {
  place: Place
  typeId: MinecraftEntityTypes | CustomEntityTypes
  loot: LootTable
  spawnEvent: boolean | string
  respawnTime: number
  allowedEntities: string[] | 'all'
  radius: number
}

export class Boss {
  /** Boss Database. Contains meta information about spawned boss entities */
  static db = table<BossDB>('boss')
  static arenaDb = table<BossArenaDB>('bossArena')

  /** List of all registered boss types */
  static all: Boss[] = []

  static create() {
    return Group.placeCreator(place => ({
      typeId: (typeId: MinecraftEntityTypes | CustomEntityTypes) => ({
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

  static entityTag = 'lw:boss'

  entity: Entity | undefined

  region?: BossArenaRegion

  location: ConfigurableLocation<Vector3>

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

    world.afterEvents.entitySpawn.subscribe(({ entity }) => {
      if (!entity.isValid) return
      const regions = BossArenaRegion.getManyAt(entity)
      for (const region of regions) if (region.boss) EventSignal.emit(region.boss.onEntitySpawn, entity)
    })
  }

  get id() {
    return this.options.place.id
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
    this.options.loot.id = `§7${this.options.place.group.id} §fBoss ${this.options.place.shortId}`

    if (Array.isArray(this.options.allowedEntities))
      this.options.allowedEntities.push(options.typeId, MinecraftEntityTypes.Player)

    const areadb = Boss.arenaDb.get(this.options.place.id)

    this.location = location(options.place)
    this.location.onLoad.subscribe(center => {
      this.check()
      const area =
        (areadb?.area ? Area.fromJson(areadb.area) : undefined) ??
        new SphereArea({ center, radius: this.options.radius }, this.options.place.group.dimensionType)

      this.region = BossArenaRegion.create(area, {
        boss: this,
        bossName: this.options.place.name,
        permissions: { allowedEntities: this.options.allowedEntities },
      })

      if (areadb?.ldb) this.region.ldb = areadb.ldb

      this.region.onSave.subscribe(() => {
        if (this.region) {
          Boss.arenaDb.set(this.options.place.id, { area: this.region.area.toJSON(), ldb: this.region.ldb })
        }
      })
      EventLoaderWithArg.load(this.onRegionCreate, this.region)
    })

    Boss.all.push(this)
  }

  readonly onRegionCreate = new EventLoaderWithArg<BossArenaRegion>()

  readonly onBossEntitySpawn = new EventSignal<Entity>()

  readonly onEntitySpawn = new EventSignal<Entity>()

  readonly onBossEntityDie = new EventSignal()

  private logger = createLogger('Boss ' + this.options.place.id)

  private damage = new WeakPlayerMap<number>({ removeOnLeave: true })

  get dimensionType() {
    return this.options.place.group.dimensionType
  }

  private onInterval?: (boss: this) => void

  interval(interval: (boss: this) => void) {
    this.onInterval = interval
    return this
  }

  private check() {
    if (!this.location.valid || getBlockStatus(this.location.toPoint()) === 'unloaded') return

    const db = Boss.db.get(this.options.place.id)
    if (!db) {
      // First time spawn
      this.spawnEntity()
    } else {
      // Interval check
      if (db.dead) this.checkRespawnTime(db)
      else this.ensureEntity(db)
    }
  }

  private floatingText = new FloatingText(this.options.place.id, this.dimensionType)

  private checkRespawnTime(db: BossDB) {
    if (Date.now() > db.date + this.options.respawnTime) {
      this.spawnEntity()
    } else if (this.location.valid) {
      this.floatingText.update(
        Vec.add(this.location, { x: 0, y: 2, z: 0 }),
        i18nShared`${this.options.place.name}\nДо появления\nосталось ${i18n.hhmmss(this.options.respawnTime - (Date.now() - db.date))}`,
      )
    }
  }

  private getName() {
    if (typeof this.options.place.name === 'string')
      throw new TypeError(`Boss ${this.id} name is string, expected I18nSharedMessage`)

    return this.options.place.name.to(defaultLang)

    // TODO add once supported
    // return this.options.place.name.toRawText()
  }

  private spawnEntity() {
    if (!this.location.valid) return

    this.logger.info`Spawn: ${this.options.typeId} ${this.options.spawnEvent ? '<lw:boss>' : ''}`
    this.entity = world[this.dimensionType].spawnEntity<CustomEntityTypes>(this.options.typeId, this.location, {
      spawnEvent: this.options.spawnEvent ? 'lw:boss' : undefined,
    })

    try {
      new Temporary(({ world, cleanup }) => {
        world.afterEvents.entitySpawn.subscribe(({ entity }) => {
          if (entity.id !== this.entity?.id) return

          system.delay(() => {
            entity.nameTag = this.getName()
            entity.addTag(Boss.entityTag)
            EventSignal.emit(this.onBossEntitySpawn, entity)
          })
          cleanup()
        })
      })
    } catch (e) {
      this.logger.error(e)
    }

    // Save to database
    Boss.db.set(this.options.place.id, { id: this.entity.id, date: Date.now(), dead: false })
  }

  /** Ensures that entity exists and if not calls onDie method */
  private ensureEntity(db: BossDB) {
    const entities = world[this.dimensionType].getEntities({ type: this.options.typeId, tags: [Boss.entityTag] })

    for (const entity of entities) {
      if (entity.id === db.id) {
        this.entity ??= entity
      } else entity.remove()
    }

    if (!this.entity?.isValid) {
      // Boss died or unloaded, respawn after interval
      this.onDie({ dropLoot: false })
    } else {
      // Boss alive
      if (this.region && this.location.valid && !this.region.area.isIn(this.entity)) this.entity.teleport(this.location)

      this.onInterval?.(this)
      this.entity.nameTag = this.getName()
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
    EventSignal.emit(this.onBossEntityDie, undefined)
    const location = this.entity?.isValid ? this.entity.location : this.location
    delete this.entity

    Boss.db.set(this.options.place.id, { id: '', date: Date.now(), dead: true })

    if (dropLoot) {
      for (const player of world.getAllPlayers()) player.tell(i18n.header`Убит босс ${this.options.place.name}!`)

      this.options.loot.generate().forEach(e => {
        if (e) {
          const item = world[this.dimensionType].spawnItem(e, location)
          forceAllowSpawnInRegion(item)
        }
      })
      const players = world.getAllPlayers()

      for (const [playerId, damage] of this.damage) {
        const player = players.find(e => e.id === playerId)
        if (!player) return

        givePlayerMoneyAndXp(player, ~~(damage * 5), ~~(damage / 6))
        player.scores.pvp = 0
      }
      this.damage.clear()
    }
  }
}
