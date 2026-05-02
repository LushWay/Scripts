import { LocationInUnloadedChunkError, Player, system, world } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { defaultLang } from 'lib/assets/lang'
import { form } from 'lib/form/new'
import { is } from 'lib/roles'
import { customItems } from 'lib/rpg/custom-item'
import { FloatingText } from 'lib/rpg/floating-text'
import { LootTable } from 'lib/rpg/loot-table'
import { lootTablePreview } from 'lib/rpg/loot-table-preview'
import { Place } from 'lib/rpg/place'
import { PlaceAction } from '../action'
import { ItemLoreSchema } from '../database/item-stack'
import { i18n, i18nShared, noI18n } from '../i18n/text'
import { ConfigurableLocation, ValidLocation, location } from '../location'
import CrateLootAnimation from './animation'

export class Crate {
  static crates = new Map<string, Crate>()

  static getName(id: string, crate = Crate.crates.get(id)) {
    if (crate) {
      return i18nShared.join`${crate.place.group.name} - ${crate.place.name}`
    } else return noI18n`Unknown`
  }

  static typeIds: string[] = [MinecraftBlockTypes.EnderChest, MinecraftBlockTypes.Chest]

  private location: ConfigurableLocation<Vector3>

  private floatingText: FloatingText

  private readonly id: string

  constructor(
    public place: Place,
    private lootTable: LootTable,
    public dimensionType: DimensionType = place.group.dimensionType,
  ) {
    this.id = place.id
    this.location = location(place)
    this.floatingText = new FloatingText(this.id, this.dimensionType)
    this.location.onLoad.subscribe(l => this.onValidLocation(l))

    Crate.crates.set(this.id, this)

    system.runTimeout(() => customItems.push(this.createKeyItemStack()), 'add key', 10)
  }

  createKeyItemStack() {
    // TODO Use player.lang
    return schema.create(defaultLang, { crate: this.id }).item
  }

  private onValidLocation(location: ValidLocation<Vector3>) {
    this.floatingText.update(location, i18nShared`${this.place.name} ящик`)
    if (location.firstLoad) PlaceAction.onInteract(location, p => this.onInteract(p), this.dimensionType)

    try {
      const block = world[this.dimensionType].getBlock(location)
      if (!block || !Crate.typeIds[0] || Crate.typeIds.includes(block.typeId)) return

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

      const storage = schema.parse(player.lang, player.mainhand())
      if (!storage) {
        return this.preview.show(player)
      }

      if (storage.crate !== this.id) {
        return player.fail(i18n.error`Ключ для ${Crate.getName(storage.crate)} не подходит к ящику ${this.name}`)
      }

      this.open(player, this.location)
    })

    return false
  }

  private open(player: Player, location: Vector3) {
    player.success(i18n`Открыт ящик ${this.name}!`, false)
    player.mainhand().setItem(undefined)

    this.animation.start(player, this.lootTable.generateOne(), location)
  }

  private preview = form((f, { player }) => {
    f.title(this.name)
      .body(i18n`Чтобы открыть этот сундук, возьмите в руки ключ`)
      .button(i18n`Купить ключ`, () => {
        player.fail(noI18n`Пока не работает.`)
      })
      .button(i18n`Посмотреть содержимое`, this.previewItems.show)

    if (is(player.id, 'techAdmin'))
      f.button('admin: get key', () => player.container?.addItem(this.createKeyItemStack()))
  })

  private previewItems = lootTablePreview({
    lootTable: this.lootTable,
    name: i18n.header`${i18n`${this.name} ящик`} > Содержимое`,
    one: true,
  })

  private animation = new CrateLootAnimation(this.place.id, this.dimensionType)
}

const schema = new ItemLoreSchema('crate')
  .property('crate', String)

  .nameTag((_, storage) => i18n.header`Ключ для ящика ${Crate.getName(storage.crate)}`)
  .lore(lore => [i18n`Используйте этот ключ, чтобы открыть ящик с лутом!`, ...lore])

  .build()
