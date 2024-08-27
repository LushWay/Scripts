import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Cooldown, Loot, LootTable, Vector, isKeyof, ms, registerSaveableRegion } from 'lib'
import { StructureFile, structureFiles } from 'lib/assets/structures'
import { Area } from 'lib/region/areas/area'
import { SphereArea } from 'lib/region/areas/sphere'
import { Region, RegionCreationOptions, RegionPermissions } from 'lib/region/kinds/region'
import { Dungeon } from './loot'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type DungeonRegionDatabase = {
  chests: Record<string, number | null>
  structureId: string
}

interface DungeonRegionOptions extends RegionCreationOptions {
  structureId: string
}

export class DungeonRegion extends Region {
  static dungeons: DungeonRegion[] = []

  static {
    system.runInterval(
      () => {
        for (const dungeon of this.dungeons) {
          for (const chest of dungeon.chests) {
            const placed = dungeon.linkedDatabase.chests[chest.id]
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
    this.linkedDatabase.structureId = options.structureId
  }

  linkedDatabase: DungeonRegionDatabase = {
    chests: {},
    structureId: '',
  }

  protected structureFile: StructureFile | undefined

  get structureId() {
    return this.linkedDatabase.structureId
  }

  protected structureSize: Vector3 = Vector.one

  protected configureDungeon(): void {
    if (this.structureFile) {
      const loot = isKeyof(this.structureId, Dungeon.loot) ? Dungeon.loot[this.structureId] : Dungeon.defaultLoot
      for (const f of this.structureFile.chestPositions) {
        this.createChest(f, loot)
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
    openContainers: true,
    owners: [],
    allowedEntities: 'all',
  }

  protected chests: DungeonChest[] = []

  protected createChest(location: Vector3, loot: LootTable | ((loot: Loot) => LootTable)) {
    // console.log('Created a chest at', Vector.string(location, true))
    const id = Vector.string(location)
    const chest: DungeonChest = {
      id,
      location,
      loot: loot instanceof LootTable ? loot : loot(new Loot('DungeonChest' + this.key + id)),
      restoreTime: ms.from('min', 5),
    }

    this.chests.push(chest)
    return {
      restoreTime(time: number) {
        chest.restoreTime = time
        return this
      },
    }
  }

  private updateChest(chest: DungeonChest) {
    const block = this.dimension.getBlock(Vector.add(this.structurePosition, chest.location))
    if (!block?.isValid()) return

    this.linkedDatabase.chests[chest.id] = Date.now()

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

  private placeStructure() {
    console.log('placing structure', this.structureId)
    world.structureManager.place(this.structureId, this.dimension, this.structurePosition)
  }

  get displayName(): string | undefined {
    return isKeyof(this.structureId, Dungeon.names) ? Dungeon.names[this.structureId] : 'Данж'
  }
}
registerSaveableRegion('dungeon', DungeonRegion as typeof Region)

interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}
