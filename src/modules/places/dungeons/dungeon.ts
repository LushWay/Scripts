import { EntityTypes, Player, StructureRotation, StructureSaveMode, system, world } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftEntityTypes } from '@minecraft/vanilla-data'
import {
  ActionForm,
  adventureModeRegions,
  Cooldown,
  isKeyof,
  LootTable,
  ms,
  registerRegionType,
  registerSaveableRegion,
  Vec,
} from 'lib'
import { StructureDungeonsId, StructureFile, structureFiles } from 'lib/assets/structures'
import { i18n, noI18n } from 'lib/i18n/text'
import { anyPlayerNear } from 'lib/player-move'
import { Area } from 'lib/region/areas/area'
import { SphereArea } from 'lib/region/areas/sphere'
import { Region, RegionCreationOptions, RegionPermissions } from 'lib/region/kinds/region'
import { createLogger } from 'lib/utils/logger'
import { structureLikeRotate, structureLikeRotateRelative, toAbsolute, toRelative } from 'lib/utils/structure'
import { Dungeon } from './loot'

const logger = createLogger('dungeon')

export interface DungeonRegionDatabase extends JsonObject {
  chests: Record<string, number | null>
  spawnerCooldowns?: Record<string, number>
  structureId: string
  rotation: StructureRotation
  terrainStructureId: string
  terrainStructurePosition: { x: number; z: number; y: number }
}

interface DungeonRegionOptions extends RegionCreationOptions {
  structureId: string
  rotation: StructureRotation
}

export interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}

export interface DungeonSpawner {
  id: string
  restoreTime: number
  location: Vector3
  entities: { typeId: string; amount: number }[]
}

export class DungeonRegion extends Region {
  static logger = createLogger('DungeonRegion')

  static dungeons: DungeonRegion[] = []

  static oldChestLogPositions = new Set<string>()

  static {
    system.runInterval(
      () => {
        for (const dungeon of this.dungeons) {
          for (const chest of dungeon.chests) {
            const placed = dungeon.ldb.chests[chest.id]
            if (!placed || Cooldown.isExpired(placed, chest.restoreTime)) {
              dungeon.updateChest(chest)
            }
          }

          for (const spawner of dungeon.spawners) {
            dungeon.ldb.spawnerCooldowns ??= {}
            const cooldown = dungeon.ldb.spawnerCooldowns[spawner.id]
            if (!cooldown || Cooldown.isExpired(cooldown, spawner.restoreTime)) {
              if (dungeon.spawn(spawner)) {
                dungeon.ldb.spawnerCooldowns[spawner.id] = Date.now()
                dungeon.save()
              }
            }
          }

          // Old chest
          for (const chest of Object.keys(dungeon.ldb.chests)) {
            const vector = Vec.parse(chest)
            if (!vector) continue

            if (dungeon.chests.find(e => Vec.equals(e.location, vector))) continue

            const oldChestPosition = Vec.string(vector, true)
            if (!this.oldChestLogPositions.has(oldChestPosition)) {
              this.logger.info('Found old chest', oldChestPosition, 'removing once there is any player nearby...')
              this.oldChestLogPositions.add(oldChestPosition)
            }

            if (anyPlayerNear(vector, dungeon.dimensionType, 20)) {
              try {
                this.logger.info('Trying to remove old chest', oldChestPosition)
                dungeon.dimension.setBlockType(vector, MinecraftBlockTypes.Air)
                Reflect.deleteProperty(dungeon.ldb.chests, chest)
                dungeon.save()
              } catch (e) {}
            }
          }
        }
      },
      'dungeonRegionChestLoad',
      20,
    )
  }

  constructor(area: Area, options: DungeonRegionOptions, key: string) {
    super(area, options, key)
    this.ldb.structureId = options.structureId
    this.ldb.rotation = options.rotation
  }

  ldb: DungeonRegionDatabase = {
    chests: {},
    spawnerCooldowns: {},
    structureId: '',
    terrainStructureId: '',
    terrainStructurePosition: { x: 0, z: 0, y: 0 },
    rotation: StructureRotation.None,
  }

  protected structureFile: StructureFile | undefined

  get structureId() {
    return this.ldb.structureId
  }

  protected configureDungeon(): void {
    if (!this.structureFile) return
    const { chestPositions, enderChestPositions, shulkers } = this.structureFile
    const toRotated = (f: Vector3[]) => this.rotate(f.map(e => this.fromRelativeToAbsolute(e)))

    const loot = Dungeon.loot[this.structureId] ?? Dungeon.defaultLoot
    for (const f of toRotated(chestPositions)) this.createChest(f, loot)

    const powerfullLoot = Dungeon.powerfullLoot[this.structureId] ?? Dungeon.defaultLoot
    for (const f of toRotated(enderChestPositions)) this.createChest(f, powerfullLoot)

    for (const { loc, inv } of shulkers) {
      this.ldb.spawnerCooldowns ??= {}

      const [rotated] = this.rotate([this.fromRelativeToAbsolute(loc)])
      if (!rotated) {
        logger.warn('Not rotated')
        continue
      }

      this.createSpawnerFromShulkerInventory(inv, rotated)
    }
  }

  private rotate(vectors: Vector3[]) {
    const { structureFile } = this
    if (!structureFile) return vectors
    return structureLikeRotate({
      rotation: this.ldb.rotation,
      position: this.getStructurePosition(),
      size: structureFile.size,
      vectors: vectors,
    })
  }

  protected override onCreate() {
    this.onRestore()
    this.placeStructure()
  }

  protected override onRestore() {
    DungeonRegion.dungeons.push(this)
    this.configureSize()
    this.configureDungeon()
  }

  configureSize() {
    // logger.info('Configuring size of', this.structureId, this.linkedDatabase)
    if (isKeyof(this.structureId, structureFiles)) {
      this.structureFile = structureFiles[this.structureId]
      // logger.info('Created dungeon with size', Vector.string(this.structureSize))
    } else return false

    if (this.area instanceof SphereArea) {
      this.area.radius = Vec.distance(this.getStructurePosition(), this.area.center)
      // logger.info('Changed radius of dungeon to', this.area.radius)
    }

    return true
  }

  customFormButtons(form: ActionForm, player: Player): void {
    form.button(noI18n`Снова установить структуру`, () => {
      this.placeStructure()
    })
    form.button(noI18n`Сбросить кд`, () => {
      this.ldb.spawnerCooldowns = {}
      this.ldb.chests = {}
      this.save()
      player.success()
    })
  }

  customFormDescription(player: Player): Text.Table {
    return [
      ...super.customFormDescription(player),
      ['Rotation', this.ldb.rotation],
      ['Dungeon', Object.entries(StructureDungeonsId).find(e => e[1] === this.structureId)?.[0]],
      ['StructureId', this.ldb.structureId],
      ['StructurePosition', this.getStructurePosition()],
      ['Chests', '\n' + this.chests.map(e => `${Vec.string(e.location, true)} ${e.loot.id ?? 'no loot'}`).join('\n')],
    ]
  }

  structureBounds() {
    if (!this.structureFile) return { from: this.area.center, to: this.area.center, fromAbsolute: this.area.center }
    const fromAbsolute = this.getStructurePosition(StructureRotation.None)
    const toAbsolute = Vec.add(fromAbsolute, this.structureFile.size)
    const [from, to] = this.rotate([fromAbsolute, toAbsolute]) as [Vector3, Vector3]

    return { from: Vec.min(from, to), to: Vec.max(from, to), fromAbsolute }
  }

  protected getStructurePosition(rotation = this.ldb.rotation) {
    if (!this.structureFile) throw new TypeError('No structure file!')

    const size = this.structureFile.size
    const center = Vec.divide(size, 2)
    return Vec.fromVector3(structureLikeRotateRelative(rotation, center, size))
      .multiply(-1)
      .floor()
      .add(this.area.center)
  }

  protected placeStructure() {
    if (!this.structureFile) return
    const position = this.getStructurePosition()

    if (!this.ldb.terrainStructureId) {
      const id = `dungeon:terrain_backup_${new Date().toISOString().replaceAll(':', '|')}`
      const bounds = this.structureBounds()
      const from = Vec.add(Vec.min(position, bounds.from), { x: -1, z: -1, y: -1 })
      const to = Vec.add(Vec.max(position, bounds.to), { x: 1, z: 1, y: 1 })
      world.structureManager.createFromWorld(id, this.dimension, from, to, {
        saveMode: StructureSaveMode.World,
        includeBlocks: true,
        includeEntities: false,
      })
      this.ldb.terrainStructureId = id
      this.ldb.terrainStructurePosition = from
      logger.info('Saved backup for', this.structureId, 'with id', id)
    }

    logger.info('Placing structure', position, this.structureId)
    world.structureManager.place(this.structureId, this.dimension, position, { rotation: this.ldb.rotation })

    for (const spawner of this.spawners) {
      try {
        this.dimension.setBlockType(spawner.location, MinecraftBlockTypes.Air)
      } catch (e) {
        logger.error('clear spawner', e)
      }
    }
  }

  fromAbsoluteToRelative(vector: Vector3) {
    return toRelative(vector, this.getStructurePosition())
  }

  fromRelativeToAbsolute(vector: Vector3) {
    return toAbsolute(vector, this.getStructurePosition())
  }

  protected defaultPermissions: RegionPermissions = {
    pvp: true,
    switches: true,
    doors: true,
    trapdoors: false,
    gates: false,
    openContainers: true,
    owners: [],
    allowedEntities: 'all',
    allowedAllItem: true,
  }

  private spawners: DungeonSpawner[] = []

  protected createSpawnerFromShulkerInventory(
    inv: { amount: number; typeId: string }[],
    rotated: Vector3,
    restoreTime?: number,
  ) {
    const entities: DungeonSpawner['entities'] = []
    for (const value of inv) {
      const entityTypeId = /^(?:minecraft:)(.+)_spawn_egg$/.exec(value.typeId)?.[1]
      if (!entityTypeId) {
        logger.warn('No entity type id for', value.typeId)
        continue
      }

      entities.push({ typeId: entityTypeId, amount: value.amount })
    }
    this.createSpawner(rotated, entities, restoreTime)
  }

  protected createSpawner(location: Vector3, entities: DungeonSpawner['entities'], restoreTime = ms.from('sec', 30)) {
    this.spawners.push({
      id: Vec.string(location),
      location,
      entities,
      restoreTime,
    })
  }

  private static invalidSpawnerTypeIds = new Set<string>()

  private brokenTypeIdsMap = new Map([['evoker', MinecraftEntityTypes.EvocationIllager]])

  private spawn(spawner: DungeonSpawner): boolean {
    if (!anyPlayerNear(spawner.location, this.dimensionType, 50)) return false

    // eslint-disable-next-line prefer-const
    for (let { typeId, amount } of spawner.entities) {
      typeId = this.brokenTypeIdsMap.get(typeId) ?? typeId
      const type = EntityTypes.get<string>(typeId)
      if (!type) {
        if (!DungeonRegion.invalidSpawnerTypeIds.has(typeId)) {
          logger.warn('Dungeon spawner invalid typeId', typeId, spawner)
          DungeonRegion.invalidSpawnerTypeIds.add(typeId)
        }
        continue
      }

      const entities = this.dimension.getEntities({ location: spawner.location, type: typeId, maxDistance: 20 })
      if (entities.length < amount) {
        const toSpawn = amount - entities.length
        logger.info(
          noI18n`Spawning for ${this.displayName} at ${Vec.string(spawner.location, true)}: ${toSpawn} ${typeId} `,
        )
        for (let i = 0; i < toSpawn; i++) {
          try {
            this.dimension.spawnEntity(type, spawner.location)
          } catch (e) {
            logger.error('spawn', e)
          }
        }
      }
    }
    return true
  }

  private chests: DungeonChest[] = []

  protected removeChest(location: Vector3) {
    this.chests = this.chests.filter(e => !Vec.equals(e.location, location))
  }

  protected createChest(location: Vector3, loot: LootTable, restoreTime = ms.from('min', 20)) {
    // logger.info(
    //   'Created a chest at',
    //   Vector.string(location, true),
    //   Vector.string(this.fromRelativeToAbsolute(location)),
    //   true,
    // )

    this.chests.push({
      id: Vec.string(location),
      location,
      loot,
      restoreTime,
    })
  }

  private updateChest(chest: DungeonChest) {
    const block = this.dimension.getBlock(chest.location)
    if (!block?.isValid) return

    this.ldb.chests[chest.id] = Date.now()
    this.save()

    if (block.typeId !== MinecraftBlockTypes.Chest) block.setType(MinecraftBlockTypes.Chest)

    const container = block.getComponent('inventory')?.container
    if (!container) throw new ReferenceError('No container in chest!')

    chest.loot.fillContainer(container)
  }

  delete(): void {
    const { terrainStructureId: id, terrainStructurePosition: position } = this.ldb
    const { dimension } = this
    super.delete()

    system.delay(() => {
      try {
        if (id) {
          logger.info('Placing structure', id, 'at', position)
          world.structureManager.place(id, dimension, position)
          world.structureManager.delete(id)
        }
      } catch (e) {
        logger.warn('Unable to place structure with id', id, e)
      }
    })
  }

  get displayName(): Text | undefined {
    return Dungeon.names[this.structureId] ?? i18n`Данж`
  }
}
registerSaveableRegion('dungeon', DungeonRegion)
registerRegionType(noI18n`Данжи`, DungeonRegion, false, true)
adventureModeRegions.push(DungeonRegion)
