import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Cooldown, Loot, LootTable, RegionPermissions, Vector, isChunkUnloaded, util } from 'lib'
import { RadiusRegion } from './RadiusRegion'

interface DungeonRegionDatabase<LDB extends JsonObject> extends JsonObject {
  chests: Record<string, number | null>
  dungeon: LDB | null
}

export abstract class DungeonRegion<LDB extends JsonObject = JsonObject> extends RadiusRegion {
  static kind = 'dungeon'

  static dungeons: DungeonRegion[] = []

  static {
    system.runInterval(
      () => {
        for (const dungeon of this.dungeons) {
          // Maybe check chunk here, idk

          for (const chest of dungeon.chests) {
            if (isChunkUnloaded({ location: chest.location, dimensionId: dungeon.dimensionId })) continue
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

  linkedDatabase: DungeonRegionDatabase<LDB> = {
    chests: {},
    dungeon: null,
  }

  protected abstract structureId: string

  protected abstract structureSize: Vector3

  protected abstract configureDungeon(): void

  protected override onCreate() {
    const { x, y, z } = this.structureSize
    this.radius = new Vector(x, y, z).length()
    this.placeStructure()
    this.onRestore()
  }

  protected override onRestore() {
    DungeonRegion.dungeons.push(this)
    this.configureDungeon()
  }

  protected defaultPermissions: RegionPermissions = {
    pvp: true,
    doorsAndSwitches: true,
    openContainers: true,
    owners: [],
    allowedEntities: 'all',
  }

  protected chests: DungeonChest[] = []

  protected createChest(location: Vector3, loot: LootTable | ((loot: Loot) => LootTable)) {
    const id = Vector.string(location)
    const chest: DungeonChest = {
      id,
      location,
      loot: loot instanceof LootTable ? loot : loot(new Loot('DungeonChest' + this.key + id)),
      restoreTime: util.ms.from('min', 5),
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
    this.linkedDatabase.chests[chest.id] = Date.now()
    const block = world[this.dimensionId].getBlock(Vector.add(this.center, chest.location))
    if (!block?.isValid()) throw new ReferenceError('Chest block is not loaded!')

    if (block.typeId !== MinecraftBlockTypes.Chest) block.setType(MinecraftBlockTypes.Chest)

    const container = block.getComponent('inventory')?.container
    if (!container) throw new ReferenceError('No container in chest!')

    chest.loot.fillContainer(container)
  }

  protected get structurePosition() {
    return Vector.add(this.center, Vector.multiply(this.structureSize, -0.5))
  }

  getVisualStructure() {
    return { position: this.structurePosition, size: this.structureSize }
  }

  private placeStructure() {
    world.structureManager.place(this.structureId, world[this.dimensionId], this.structurePosition)
  }
}

interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}
