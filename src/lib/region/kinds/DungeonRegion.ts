import { system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { Cooldown, Loot, LootTable, Vector, isChunkUnloaded, util } from 'lib'
import { RadiusRegion } from './RadiusRegion'

interface DRD<LDB extends JsonObject> extends JsonObject {
  chests: Record<string, number | null>
  dungeon: LDB | null
}

export abstract class DungeonRegion<LDB extends JsonObject = JsonObject> extends RadiusRegion {
  static kind = 'dungeon'

  static dungeons: DungeonRegion[]

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
      20 * 60,
    )
  }

  linkedDatabase: DRD<LDB> = {
    chests: {},
    dungeon: null,
  }

  protected abstract structureId: string

  protected abstract structurePosition: Vector3

  protected abstract configureDungeon(): void

  protected override onCreate() {
    DungeonRegion.dungeons.push(this)
    this.placeStructure()
    this.configureDungeon()
  }

  protected override onRestore() {
    this.onCreate()
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
    const block = world[this.dimensionId].getBlock(chest.location)
    if (!block?.isValid()) throw new ReferenceError('Chest block is not loaded!')

    if (block.typeId !== MinecraftBlockTypes.Chest) block.setType(MinecraftBlockTypes.Chest)

    const container = block.getComponent('inventory')?.container
    if (!container) throw new ReferenceError('No container in chest!')

    chest.loot.fillContainer(container)
  }

  private placeStructure() {
    world.structureManager.place(
      this.structureId,
      world[this.dimensionId],
      Vector.add(this.center, this.structurePosition),
    )
  }
}

interface DungeonChest {
  id: string
  restoreTime: number
  loot: LootTable
  location: Vector3
}
