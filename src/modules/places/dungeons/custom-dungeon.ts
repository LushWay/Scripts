import { Block, GameMode, Player, StructureRotation, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { is, ModalForm, ms, RegionCreationOptions, registerRegionType, registerSaveableRegion, Vec } from 'lib'
import { StructureDungeonsId, StructureFile } from 'lib/assets/structures'
import { i18n, noI18n } from 'lib/i18n/text'
import { Area } from 'lib/region/areas/area'
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
    super(area, { ...options, structureId: '', rotation: StructureRotation.None }, key)
    this.ldb.name = options.name
  }

  override ldb: CustomDungeonRegionDatabase = {
    chestLoot: [],
    chests: {},
    structureId: '',
    name: '',
    rotation: StructureRotation.None,
    terrainStructureId: '',
    terrainStructurePosition: { x: 0, z: 0, y: 0 },
  }

  protected override configureDungeon(): void {
    for (const chest of this.ldb.chestLoot) {
      const loot = Dungeon.customLoot[chest.loot] ?? Dungeon.defaultLoot
      this.createChest(chest.location, loot, chest.restoreTime)
    }
  }

  protected override structureFile: StructureFile = {
    chestPositions: [],
    enderChestPositions: [],
    size: { x: 10, y: 10, z: 10 },
  }

  protected override placeStructure(): void {
    // Do nothing
  }

  override configureSize(): boolean {
    return this.ldb.name in Dungeon.customNames
  }

  override get structureId(): StructureDungeonsId {
    return '' as StructureDungeonsId
  }

  override get displayName() {
    return Dungeon.customNames[this.ldb.name] ?? i18n`Данж`
  }

  addCustomChest(location: Vector3, loot: keyof (typeof Dungeon)['customLoot'], restoreTimeMin: number) {
    const restoreTime = ms.from('min', restoreTimeMin)
    const lootTable = Dungeon.customLoot[loot] ?? Dungeon.defaultLoot
    this.ldb.chestLoot.push({ location, loot, restoreTime })
    this.createChest(location, lootTable, restoreTime)
    this.save()
  }
}
registerSaveableRegion('customDungeon', CustomDungeonRegion)
registerRegionType(noI18n`Кастомный данж`, CustomDungeonRegion, false, true)

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

  editChest(player, block, region)
})

world.afterEvents.playerBreakBlock.subscribe(({ player, block, brokenBlockPermutation }) => {
  if (brokenBlockPermutation.type.id !== MinecraftBlockTypes.Chest) return false

  const region = eventHelper(player, block)
  if (!region) return

  const location = block.location
  const chest = getChest(region, location)
  if (chest) {
    region.ldb.chestLoot = region.ldb.chestLoot.filter(e => e !== chest)
    region.chests = region.chests.filter(e => !Vec.equals(e.location, location))

    player.success(i18n`Removed chest with loot ${chest.loot} and restore time ${chest.restoreTime / 60_000}min`)
  }
})

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
  const { player, block } = event
  if (player.getGameMode() !== GameMode.Creative) return
  if (!player.isSneaking) return

  const region = CustomDungeonRegion.getAt(block)
  if (!region) return

  const chest = getChest(region, block.location)
  if (chest) {
    event.cancel
    system.delay(() => {
      editChest(player, block.location, region, chest)
    })
  }
})

function editChest(
  player: Player,
  location: Vector3,
  region: CustomDungeonRegion,
  chest?: CustomDungeonRegionDatabase['chestLoot'][number],
) {
  const keys: string[] = []

  new ModalForm(noI18n`Сундук с лутом`)
    .addDropdownFromObject(
      noI18n`Лут`,
      Object.fromEntries(
        Object.entriesStringKeys(Dungeon.customLoot)
          .map(([key, value]) => [key, (value?.id ?? key).replace('mystructure:dungeons/', '')])
          .filter(e => (keys.includes(e[1] ?? '') ? false : (keys.push(e[1] ?? ''), true))),
      ),
      { defaultValueIndex: chest?.loot },
    )
    .addSlider(noI18n`Время восстановления (в минутах)`, 1, 180, 1, chest ? chest.restoreTime / 60_000 : 20)
    .show(player, (_, loot, restoreTime) => {
      if (chest) {
      } else {
        region.addCustomChest(location, loot as keyof (typeof Dungeon)['customLoot'], restoreTime)
      }
      player.success(i18n`Created a chest with loot ${loot} and restore time ${restoreTime}min`)
    })
}

function getChest(region: CustomDungeonRegion, location: Vector3) {
  return region.ldb.chestLoot.find(e => Vec.equals(e.location, location))
}
