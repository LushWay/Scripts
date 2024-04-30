import { ContainerSlot, ItemStack, ItemTypes, Player, system, world } from '@minecraft/server'
import { extend, util } from 'lib.js'
import { stringifyBlocksSetRef } from 'modules/WorldEdit/utils/blocksSet.js'
import { WE_PLAYER_SETTINGS } from '../settings.js'

/** @typedef {(player: Player, slot: ContainerSlot, settings: ReturnType<typeof WE_PLAYER_SETTINGS>) => void} IntervalFunction */

/** @typedef {'blocksSet' | 'replaceBlocksSet' | 'height' | 'size' | 'shape' | 'maxDistance' | 'zone'} LoreStringName */

const LORE_SEPARATOR = '\u00a0'
/** @type {(LoreStringName | string)[]} */

const LORE_BLOCKS_SET_KEYS_T = ['blocksSet', 'replaceBlocksSet']

/**
 * @template {{ [P in LoreStringName]?: any } & { version: number }} [LoreFormat=any] Default is `any` . Default is
 *   `any`
 */
export class WorldEditTool {
  /** @type {string[]} */
  static loreBlockSetKeys = LORE_BLOCKS_SET_KEYS_T

  /** @type {WorldEditTool<any>[]} */
  static tools = []

  /** @type {IntervalFunction[]} */
  static intervals = []

  /**
   * @param {Object} o
   * @param {string} o.name
   * @param {string} o.displayName
   * @param {string} o.itemStackId
   * @param {(slot: ContainerSlot, player: Player, initial?: boolean) => void} [o.editToolForm]
   * @param {LoreFormat} [o.loreFormat]
   * @param {IntervalFunction} [o.interval0]
   * @param {IntervalFunction} [o.interval10]
   * @param {IntervalFunction} [o.interval20]
   * @param {(player: Player, item: ItemStack) => void} [o.onUse]
   * @param {Partial<WorldEditTool<LoreFormat>> & ThisType<WorldEditTool<LoreFormat>>} [o.overrides]
   */
  constructor({
    name,
    displayName,
    itemStackId,
    editToolForm,
    loreFormat,
    interval0,
    interval10,
    interval20,
    onUse,
    overrides,
  }) {
    WorldEditTool.tools.push(this)
    this.name = name
    this.displayName = displayName
    this.itemId = itemStackId
    if (editToolForm) this.editToolForm = editToolForm
    this.loreFormat = loreFormat ?? { version: 0 }
    this.loreFormat.version ??= 0
    this.onUse = onUse
    this.interval0 = interval0
    this.interval10 = interval10
    this.interval20 = interval20
    if (overrides) extend(this, overrides)

    this.command = new Command({
      name,
      description: `Создает${editToolForm ? ' или редактирует ' : ''}${displayName}`,
      role: 'builder',
      type: 'we',
    }).executes(ctx => {
      const slotOrError = this.getToolSlot(ctx.sender)

      if (typeof slotOrError === 'string') ctx.error(slotOrError)
      else if (this.editToolForm) this.editToolForm(slotOrError, ctx.sender, true)
    })
  }

  /** @param {Player} player */
  getToolSlot(player) {
    const slot = player.mainhand()

    if (!slot.typeId) {
      const item = ItemTypes.get(this.itemId)
      if (!item) throw new TypeError(`ItemType '${this.itemId}' does not exists`)
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
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId
    const air = !typeId
    return edit ? '§2' : air ? '' : '§8'
  }

  /**
   * @param {Player} player
   * @returns {string}
   */
  getMenuButtonName(player) {
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId

    if (!this.editToolForm && edit) return ''

    return `${this.getMenuButtonNameColor(player)}${edit ? 'Редактировать' : 'Создать'} ${this.displayName}`
  }

  /**
   * @overload
   * @param {string[]} lore
   * @param {false} [returnUndefined]
   * @returns {LoreFormat}
   */
  /**
   * @overload
   * @param {string[]} lore
   * @param {true} returnUndefined
   * @returns {LoreFormat | undefined}
   */
  /**
   * @param {string[]} lore
   * @param {boolean} [returnUndefined]
   * @returns {LoreFormat | undefined}
   */
  parseLore(lore, returnUndefined = false) {
    let raw
    try {
      raw = JSON.parse(
        lore
          .slice(lore.findIndex(e => e.includes(LORE_SEPARATOR)) + 1)
          .join('')
          .replace(/§(.)/g, '$1'),
      )
    } catch (e) {
      e
    }
    if (raw?.version !== this.loreFormat.version) {
      if (returnUndefined) return undefined
      raw = JSON.parse(JSON.stringify(this.loreFormat))
    }
    delete raw.version

    return raw
  }

  /** @type {Record<string, string>} */
  loreTranslation = {
    shape: 'Форма',
    size: 'Размер',
    height: 'Высота',
    maxDistance: 'Расстояние',
    blocksSet: 'Блоки',
    replaceBlocksSet: 'Заменяет',
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
        .map(([key, value]) => {
          const val = WorldEditTool.loreBlockSetKeys.includes(key) ? stringifyBlocksSetRef(value) : util.inspect(value)
          const k = this.loreTranslation[key] ?? key
          return `${k}: ${val}`.match(/.{0,48}/g) || []
        })
        .flat()
        .filter(Boolean)
        .map(e => '§r§f' + e),

      LORE_SEPARATOR,

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
  WorldEditTool.tools
    .filter(e => e.itemId === item.typeId)
    .forEach(tool => util.catch(() => tool?.onUse?.(player, item)))
})

let ticks = 0
system.runInterval(
  () => {
    for (const player of world.getAllPlayers()) {
      if (!player) continue
      const item = player.mainhand()
      const tool = WorldEditTool.tools.find(e => e.itemId === item.typeId)
      const settings = WE_PLAYER_SETTINGS(player)
      WorldEditTool.intervals.forEach(e => e(player, item, settings))
      if (!tool) continue
      /** @type {(undefined | IntervalFunction)[]} */
      const fn = [tool.interval0]
      if (ticks % 10 === 0) fn.push(tool.interval10)
      if (ticks % 20 === 0) fn.push(tool.interval20)

      fn.forEach(e => e?.(player, item, settings))
    }
    if (ticks >= 20) ticks = 0
    else ticks++
  },
  'we tool',
  0,
)
