import {
  ContainerSlot,
  EquipmentSlot,
  ItemStack,
  ItemTypes,
  Player,
  system,
  world,
} from '@minecraft/server'
import { util } from 'xapi.js'
import { WE_PLAYER_SETTINGS } from '../index.js'

/**
 * @template {Record<string, any> & {version: number}} [LoreFormat=any]
 */
export class WorldEditTool {
  /**
   * @type {WorldEditTool<any>[]}
   */
  static tools = []

  /**
   * @param {Object} o
   * @param {string} o.name
   * @param {string} o.displayName
   * @param {string} o.itemStackId
   * @param {(slot: ContainerSlot, player: Player) => void} [o.editToolForm]
   * @param {LoreFormat} [o.loreFormat]
   * @param {(player: Player, slot: ContainerSlot, settings: ReturnType<typeof WE_PLAYER_SETTINGS>) => void} [o.interval]
   * @param {(player: Player, item: ItemStack) => void} [o.onUse]
   */
  constructor({
    name,
    displayName,
    itemStackId,
    editToolForm,
    loreFormat,
    interval,
    onUse,
  }) {
    WorldEditTool.tools.push(this)
    this.name = name
    this.displayName = displayName
    this.itemId = itemStackId
    if (editToolForm) this.editToolForm = editToolForm
    this.loreFormat = loreFormat ?? { version: 0 }
    this.loreFormat.version ??= 0
    this.onUse = onUse
    this.interval = interval
    this.command = new XCommand({
      name,
      description: `Создает${
        editToolForm ? ' или редактирует ' : ''
      }${displayName}`,
      role: 'builder',
      type: 'we',
    }).executes(ctx => {
      const slotOrError = this.getToolSlot(ctx.sender)

      if (typeof slotOrError === 'string') ctx.error(slotOrError)
      else if (this.editToolForm) this.editToolForm(slotOrError, ctx.sender)
    })
  }
  /**
   * @param {Player} player
   */
  getToolSlot(player) {
    const slot = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)

    if (!slot.typeId) {
      const item = ItemTypes.get(this.itemId)
      if (!item)
        throw new TypeError(`ItemType '${this.itemId}' does not exists`)
      slot.setItem(new ItemStack(item))
      return slot
    } else if (slot.typeId === this.itemId) {
      return slot
    } else {
      return `Выбери пустой слот чтобы создать ${this.displayName} или возьми для настройки!`
    }
  }
  /**
   * @param {Player} player
   * @returns {string}
   */
  getMenuButtonNameColor(player) {
    const { typeId } = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)

    const edit = typeId === this.itemId
    const air = !typeId
    return edit ? '§2' : air ? '' : '§8'
  }
  /**
   * @param {Player} player
   * @returns {string}
   */
  getMenuButtonName(player) {
    const { typeId } = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)

    const edit = typeId === this.itemId

    if (!this.editToolForm && edit) return ''

    return `${this.getMenuButtonNameColor(player)}${
      edit ? 'Редактировать' : 'Создать'
    } ${this.displayName}`
  }
  /**
   * @param {string[]} lore
   * @returns {LoreFormat}
   */
  parseLore(lore) {
    let raw
    try {
      raw = JSON.parse(
        lore
          .slice(lore.findIndex(e => e.includes('\x01')) + 1)
          .join('')
          .replace(/§(.)/g, '$1')
      )
    } catch (e) {
      e
    }
    if (raw?.version !== this.loreFormat.version) {
      // @ts-expect-error yes
      return this.loreFormat
    }
    delete raw.version

    return raw
  }
  /** @type {Record<string, string>} */
  loreTranslation = {
    shape: 'Форма',
    size: 'Размер',
    height: 'Высота',
    blocksSet: 'Набор блоков',
  }
  /**
   * @param {LoreFormat} format
   * @returns {string[]}
   */
  stringifyLore(format) {
    format.version ??= this.loreFormat.version
    return [
      ...Object.entries(format)
        .filter(([key]) => key !== 'version')
        .map(
          ([key, value]) =>
            `§r§f${this.loreTranslation[key] ?? key}: ${util.inspect(value)}`
        ),

      '\x01',

      ...(JSON.stringify(format)
        .split('')
        .map(e => '§' + e)
        .join('')
        .match(/.{0,50}/g) || []),
    ]
  }
}

world.afterEvents.itemUse.subscribe(({ source: player, itemStack: item }) => {
  if (!(player instanceof Player)) return
  const tool = WorldEditTool.tools.find(e => e.itemId === item.typeId)
  util.catch(() => tool && tool.onUse && tool.onUse(player, item))
})

system.runPlayerInterval(
  player => {
    const item = player
      .getComponent('equippable')
      .getEquipmentSlot(EquipmentSlot.Mainhand)

    const tool = WorldEditTool.tools.find(e => e.itemId === item.typeId)
    if (tool && tool.interval)
      tool.interval(player, item, WE_PLAYER_SETTINGS(player)) //
  },
  'we tool',
  10
)
