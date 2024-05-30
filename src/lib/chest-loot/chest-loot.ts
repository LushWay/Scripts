import { LocationInUnloadedChunkError, Player, system, world, type ShortcutDimensions } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { LootTable } from 'lib/loot-table'
import { PlaceAction } from '../action'
import { ItemLoreSchema, ItemLoreStorage } from '../database/item-stack'
import { FloatingText } from '../floating-text'
import { SafeLocation, ValidSafeLocation, location } from '../location'
import { t } from '../text'
import ChestLootAnimation from './animation'

export class ChestLoot {
  static floatingTextDynamicProperty = 'chestloot:text'

  static chests = new Map<string, ChestLoot>()

  static getChestName(id: string) {
    return ChestLoot.chests.get(id)?.displayName ?? 'Неизвестный'
  }

  private location: SafeLocation<Vector3>

  constructor(
    public id: string,
    public locationGroup = 'chestloot',
    public displayName: Text,
    private lootTable: LootTable,
    public dimensionId: ShortcutDimensions = 'overworld',
  ) {
    this.location = location(locationGroup, id)
    this.location.onLoad.subscribe(l => this.onValidLocation(l))

    ChestLoot.chests.set(id, this)
  }

  createKeyItemStack() {
    return schema.create({ chest: this.id }).item
  }

  private floatingText = new FloatingText(this.id, this.dimensionId)

  private onValidLocation(location: ValidSafeLocation<Vector3>) {
    this.floatingText.update(location, t`Сундук ${this.displayName}`)
    if (location.firstLoad) PlaceAction.onInteract(location, p => this.onInteract(p), this.dimensionId)

    try {
      world[this.dimensionId].setBlockType(location, MinecraftBlockTypes.EnderChest)
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) return
      throw e
    }
  }

  private onInteract(player: Player) {
    system.delay(() => {
      if (!this.location.valid) {
        player.fail('Сундук еще не готов...')
        return
      }

      const storage = schema.parse(player.mainhand())
      if (!storage) {
        player.fail(t.error`Чтобы открыть этот сундук, возьмите в руки ключ для сундука ${this.displayName}!`)
        return
      }

      if (storage.chest !== this.id) {
        const name = ChestLoot.getChestName(storage.chest)
        player.fail(t.error`Ключ для ${name} не подходит к сундуку ${this.displayName}`)
        return
      }

      this.open(player, storage, this.location)
    })
  }

  private open(player: Player, storage: ItemLoreStorage<typeof schema>, location: Vector3) {
    player.success(t`Открыт сундук ${this.displayName}!`, false)
    player.mainhand().setItem(undefined)

    this.animation.start(player, this.lootTable.generateOne(), location)
  }

  private animation = new ChestLootAnimation(this.id, this.displayName, this.dimensionId)
}

const schema = new ItemLoreSchema('chestloot')
  .property('chest', String)

  .nameTag((_, storage) => t.header`Ключ для сундука ${ChestLoot.getChestName(storage.chest)}`)
  .lore(lore => [t`Используйте этот ключ, чтобы открыть сундук с лутом!`, ...lore])

  .build()
