import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Cooldown, isKeyof, Loot, LootTable, ms, registerSaveableRegion, Vector } from 'lib'
import { StructureDungeonsId, StructureFile, structureFiles } from 'lib/assets/structures'
import { Area } from 'lib/region/areas/area'
import { SphereArea } from 'lib/region/areas/sphere'
import { Region, RegionCreationOptions, RegionPermissions } from 'lib/region/kinds/region'
import { Dungeon } from './loot'

export interface DungeonRegionDatabase extends JsonObject {
  chests: Record<string, number | null>
  structureId: string
}

interface DungeonRegionOptions extends RegionCreationOptions {
  structureId: string
}

export interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}

export class DungeonRegion extends Region {
  static dungeons: DungeonRegion[] = []

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
        }
      },
      'dungeonRegionChestLoad',
      20,
    )
  }

  constructor(area: Area, options: DungeonRegionOptions, key: string) {
    super(area, options, key)
    this.ldb.structureId = options.structureId
  }

  ldb: DungeonRegionDatabase = {
    chests: {},
    structureId: '',
  }

  protected structureFile: StructureFile | undefined

  get structureId() {
    return this.ldb.structureId as StructureDungeonsId
  }

  protected structureSize: Vector3 = Vector.one

  protected configureDungeon(): void {
    if (this.structureFile) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const loot = Dungeon.loot[this.structureId] ?? Dungeon.defaultLoot
      for (const f of this.structureFile.chestPositions) {
        this.createChest(f, loot)
      }

      const powerfullLoot = Dungeon.powerfullLoot[this.structureId] ?? Dungeon.defaultLoot
      for (const f of this.structureFile.enderChestPositions) {
        this.createChest(f, powerfullLoot)
      }
    }
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
    // console.log('Configuring size of', this.structureId, this.linkedDatabase)
    if (isKeyof(this.structureId, structureFiles)) {
      this.structureFile = structureFiles[this.structureId]
      this.structureSize = this.structureFile.size
      // console.log('Created dungeon with size', Vector.string(this.structureSize))
    } else return false

    if (this.area instanceof SphereArea) {
      this.area.radius = Vector.distance(this.structurePosition, this.area.center)
      // console.log('Changed radius of dungeon to', this.area.radius)
    }

    return true
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

  chests: DungeonChest[] = []

  protected createChest(
    location: Vector3,
    loot: LootTable | ((loot: Loot) => LootTable),
    restoreTime = ms.from('min', 20),
  ) {
    // console.log('Created a chest at', Vector.string(location, true))
    const id = Vector.string(location)
    const chest: DungeonChest = {
      id,
      location,
      loot: loot instanceof LootTable ? loot : loot(new Loot('DungeonChest' + this.id + id)),
      restoreTime,
    }

    this.chests.push(chest)
  }

  fromAbsoluteToRelative(vector: Vector3) {
    return Vector.subtract(vector, this.structurePosition)
  }

  fromRelativeToAbsolute(vector: Vector3) {
    return Vector.add(this.structurePosition, vector)
  }

  private updateChest(chest: DungeonChest) {
    const block = this.dimension.getBlock(this.fromRelativeToAbsolute(chest.location))
    if (!block?.isValid) return

    this.ldb.chests[chest.id] = Date.now()

    if (block.typeId !== MinecraftBlockTypes.Chest) block.setType(MinecraftBlockTypes.Chest)

    const container = block.getComponent('inventory')?.container
    if (!container) throw new ReferenceError('No container in chest!')

    chest.loot.fillContainer(container)
  }

  protected get structurePosition() {
    return Vector.add(this.area.center, Vector.multiply(this.structureSize, -0.5))
  }

  getVisualStructure() {
    return { position: this.structurePosition, size: this.structureSize }
  }

  protected placeStructure() {
    console.log('placing structure', this.structureId)
    world.structureManager.place(this.structureId, this.dimension, this.structurePosition)
  }

  get displayName(): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return Dungeon.names[this.structureId] ?? 'Данж'
  }
}
registerSaveableRegion('dungeon', DungeonRegion as typeof Region)
