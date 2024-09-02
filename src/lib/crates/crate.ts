import { LocationInUnloadedChunkError, Player, system, world, type ShortcutDimensions } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { is } from 'lib'
import { form } from 'lib/form/new'
import { FloatingText } from 'lib/rpg/floating-text'
import { LootTable } from 'lib/rpg/loot-table'
import { lootTablePreview } from 'lib/rpg/loot-table-preview'
import { Place } from 'lib/rpg/place'
import { customItems } from 'modules/commands/items'
import { PlaceAction } from '../action'
import { ItemLoreSchema } from '../database/item-stack'
import { SafeLocation, ValidLocation, location } from '../location'
import { t } from '../text'
import CrateLootAnimation from './animation'

export class Crate {
  static crates = new Map<string, Crate>()

  static getName(id: string, crate = Crate.crates.get(id)) {
    if (crate) {
      return `${crate.place.group.name} - ${crate.place.name}`
    } else return 'Неизвестный'
  }

  static typeIds: string[] = [MinecraftBlockTypes.EnderChest, MinecraftBlockTypes.Chest]

  private location: SafeLocation<Vector3>

  private floatingText: FloatingText

  private readonly id: string

  constructor(
    public place: Place,
    private lootTable: LootTable,
    public dimensionId: ShortcutDimensions = 'overworld',
  ) {
    this.id = place.fullId
    this.location = location(place)
    this.floatingText = new FloatingText(this.id, this.dimensionId)
    this.location.onLoad.subscribe(l => this.onValidLocation(l))

    Crate.crates.set(this.id, this)

    system.runTimeout(() => customItems.push(this.createKeyItemStack()), 'add key', 10)
  }

  createKeyItemStack() {
    return schema.create({ crate: this.id }).item
  }

  private onValidLocation(location: ValidLocation<Vector3>) {
    this.floatingText.update(location, t`${this.place.name} ящик\n§7${this.place.group.name}`)
    if (location.firstLoad) PlaceAction.onInteract(location, p => this.onInteract(p), this.dimensionId)

    try {
      const block = world[this.dimensionId].getBlock(location)
      if (!block || Crate.typeIds.includes(block.typeId)) return

      block.setType(Crate.typeIds[0])
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) return
      throw e
    }
  }

  private get name() {
    return Crate.getName(this.id, this)
  }

  private onInteract(player: Player) {
    system.delay(() => {
      if (!this.location.valid) return

      const storage = schema.parse(player.mainhand())
      if (!storage) {
        return this.preview.show(player)
      }

      if (storage.crate !== this.id) {
        return player.fail(t.error`Ключ для ${Crate.getName(storage.crate)} не подходит к ящику ${this.name}`)
      }

      this.open(player, this.location)
    })

    return false
  }

  private open(player: Player, location: Vector3) {
    player.success(t`Открыт ящик ${this.name}!`, false)
    player.mainhand().setItem(undefined)

    this.animation.start(player, this.lootTable.generateOne(), location)
  }

  private preview = form((f, player) => {
    f.title(this.name)
      .body(t`Чтобы открыть этот сундук, возьмите в руки ключ`)
      .button('Купить ключ', () => {
        player.fail('Пока не работает.')
      })
      .button('Посмотреть содержимое', this.previewItems.show)

    if (is(player.id, 'techAdmin'))
      f.button('admin: get key', () => {
        const item = this.createKeyItemStack()
        item.amount = 10
        player.container?.addItem(item)
      })
  })

  private previewItems = lootTablePreview(this.lootTable, t.header`${this.name + ' ящик'} > Содержимое`, true)

  private animation = new CrateLootAnimation(this.place.fullId, this.dimensionId)
}

const schema = new ItemLoreSchema('crate')
  .property('crate', String)

  .nameTag((_, storage) => t.header`Ключ для ящика ${Crate.getName(storage.crate)}`)
  .lore(lore => [t`Используйте этот ключ, чтобы открыть ящик с лутом!`, ...lore])

  .build()
