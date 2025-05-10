import { Block, Player, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { is, ModalForm, ms, Region, RegionCreationOptions, registerSaveableRegion, Vector } from 'lib'
import { StructureDungeonsId, StructureFile } from 'lib/assets/structures'
import { Area } from 'lib/region/areas/area'
import { t } from 'lib/text'
import { DungeonRegion, DungeonRegionDatabase } from './dungeon'
import { Dungeon } from './loot'

interface CustomDungeonRegionDatabase extends DungeonRegionDatabase {
  chestLoot: {
    location: { x: number; y: number; z: number }
    loot: keyof (typeof Dungeon)['customLoot']
    restoreTime: number
  }[]
  name: keyof (typeof Dungeon)['customNames']
}

interface CustomDungeonOptions extends RegionCreationOptions {
  name: string
}

export class CustomDungeonRegion extends DungeonRegion {
  constructor(area: Area, options: CustomDungeonOptions, key: string) {
    super(area, { ...options, structureId: '' }, key)
    this.ldb.name = options.name
  }

  override ldb: CustomDungeonRegionDatabase = {
    chestLoot: [],
    chests: {},
    structureId: '',
    name: '',
  }

  protected override configureDungeon(): void {
    for (const chest of this.ldb.chestLoot) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const loot = Dungeon.customLoot[chest.loot] ?? Dungeon.defaultLoot
      this.createChest(chest.location, loot, chest.restoreTime)
    }
  }

  protected override structureFile: StructureFile = {
    chestPositions: [],
    enderChestPositions: [],
    size: this.area.size,
  }

  protected override placeStructure(): void {
    // Do nothing
  }

  override configureSize(): boolean {
    return this.ldb.name in Dungeon.customNames
  }

  override get structureId(): StructureDungeonsId {
    throw new Error('structureId is not supported for CustomDungeonRegion')
  }

  override get displayName() {
    return Dungeon.customNames[this.ldb.name] ?? 'Данж'
  }

  addCustomChest(location: Vector3, loot: keyof (typeof Dungeon)['customLoot'], restoreTimeMin: number) {
    const restoreTime = ms.from('min', restoreTimeMin)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const lootTable = Dungeon.customLoot[loot] ?? Dungeon.defaultLoot
    this.ldb.chestLoot.push({ location, loot, restoreTime })
    this.createChest(location, lootTable, restoreTime)
    this.save()
  }
}
registerSaveableRegion('customDungeon', CustomDungeonRegion as typeof Region)

function eventHelper(player: Player, block: Block) {
  if (!is(player.id, 'techAdmin')) return false

  const region = CustomDungeonRegion.getAt(block)
  if (!region) return false

  return region
}

world.afterEvents.playerPlaceBlock.subscribe(({ player, block }) => {
  if (block.typeId !== MinecraftBlockTypes.Chest) return false

  const region = eventHelper(player, block)
  if (!region) return

  const keys: string[] = []

  new ModalForm('Сундук с лутом')
    .addDropdownFromObject(
      'Лут',
      Object.fromEntries(
        Object.entriesStringKeys(Dungeon.customLoot)
          .map(([key, value]) => [key, (value.id ?? key).replace('mystructure:dungeons/', '')])
          .filter(e => (keys.includes(e[1]) ? false : (keys.push(e[1]), true))),
      ),
    )
    .addSlider('Время восстановления (в минутах)', 1, 180, 1, 20)
    .show(player, (ctx, loot, restoreTime) => {
      const relative = region.fromAbsoluteToRelative(block)
      region.addCustomChest(relative, loot as keyof (typeof Dungeon)['customLoot'], restoreTime)
      player.success(t`Created a chest with loot ${loot} and restore time ${restoreTime}min`)
    })
})

world.afterEvents.playerBreakBlock.subscribe(({ player, block, brokenBlockPermutation }) => {
  if (brokenBlockPermutation.type.id !== MinecraftBlockTypes.Chest) return false

  const region = eventHelper(player, block)
  if (!region) return

  const relative = region.fromAbsoluteToRelative(block)
  const chest = region.ldb.chestLoot.find(e => Vector.equals(e.location, relative))
  if (chest) {
    region.ldb.chestLoot = region.ldb.chestLoot.filter(e => e !== chest)
    region.chests = region.chests.filter(e => !Vector.equals(e.location, relative))

    player.success(t`Removed chest with loot ${chest.loot} and restore time ${chest.restoreTime}min`)
  }
})
