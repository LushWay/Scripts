import { LocationInUnloadedChunkError, Player, system, world, type ShortcutDimensions } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { FloatingText } from 'lib/rpg/floating-text'
import { LootTable } from 'lib/rpg/loot-table'
import { PlaceAction } from '../action'
import { ItemLoreSchema, ItemLoreStorage } from '../database/item-stack'
import { SafeLocation, ValidLocation, location } from '../location'
import { t } from '../text'
import ChestLootAnimation from './animation'

export class ChestLoot {
  static chests = new Map<string, ChestLoot>()

  static getName(id: string) {
    return ChestLoot.chests.get(id)?.displayName ?? 'Неизвестный'
  }

  private location: SafeLocation<Vector3>

  private floatingText: FloatingText

  private readonly id: string

  constructor(
    public locationId: string,
    public locationGroup = 'chestloot',
    public displayName: Text,
    private lootTable: LootTable,
    public dimensionId: ShortcutDimensions = 'overworld',
  ) {
    this.id = locationGroup + ' ' + locationId
    this.location = location(locationGroup, locationId, displayName)
    this.floatingText = new FloatingText(this.id, this.dimensionId)
    this.location.onLoad.subscribe(l => this.onValidLocation(l))

    ChestLoot.chests.set(this.id, this)
  }

  createKeyItemStack() {
    return schema.create({ chest: this.id }).item
  }

  private onValidLocation(location: ValidLocation<Vector3>) {
    this.floatingText.update(location, t`${this.displayName} cундук`)
    if (location.firstLoad) PlaceAction.onInteract(location, p => this.onInteract(p), this.dimensionId)

    try {
      const block = world[this.dimensionId].getBlock(location)
      if (!block || block.typeId === MinecraftBlockTypes.EnderChest) return

      block.setType(MinecraftBlockTypes.EnderChest)
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) return
      throw e
    }
  }

  private onInteract(player: Player) {
    system.delay(() => {
      if (!this.location.valid) return

      const storage = schema.parse(player.mainhand())
      if (!storage) {
        player.fail(t.error`Чтобы открыть этот сундук, возьмите в руки ключ для сундука ${this.displayName}!`)
        return
      }

      if (storage.chest !== this.id) {
        const name = ChestLoot.getName(storage.chest)
        player.fail(t.error`Ключ для ${name} не подходит к сундуку ${this.displayName}`)
        return
      }

      this.open(player, storage, this.location)
    })
  }

  private open(player: Player, storage: ItemLoreStorage<typeof schema>, location: Vector3) {
    player.success(t`Открыт сундук ${this.displayName}!`, false)
    player.mainhand().setItem(undefined)

    console.log(new Array(10).fill(null).map(e => this.lootTable.generateOne().nameTag))
    this.animation.start(player, this.lootTable.generateOne(), location)
  }

  private animation = new ChestLootAnimation(this.locationId, this.displayName, this.dimensionId)
}

const schema = new ItemLoreSchema('chestloot')
  .property('chest', String)

  .nameTag((_, storage) => t.header`Ключ для сундука ${ChestLoot.getName(storage.chest)}`)
  .lore(lore => [t`Используйте этот ключ, чтобы открыть сундук с лутом!`, ...lore])

  .build()
