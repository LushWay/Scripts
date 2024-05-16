import { ContainerSlot, ItemStack, ItemTypes, Player, system, world } from '@minecraft/server'
import { expand, util } from 'lib'
import { BlocksSetRef, stringifyBlocksSetRef } from 'modules/world-edit/utils/blocksSet'
import { WE_PLAYER_SETTINGS } from '../settings'

type IntervalFunction = (player: Player, slot: ContainerSlot, settings: ReturnType<typeof WE_PLAYER_SETTINGS>) => void
type LoreStringName = 'blocksSet' | 'replaceBlocksSet' | 'height' | 'size' | 'shape' | 'maxDistance' | 'zone'

const LORE_SEPARATOR = '\u00a0'
const LORE_BLOCKS_SET_KEYS_T: (LoreStringName | string)[] = ['blocksSet', 'replaceBlocksSet']

type LoreFormatType = {
  [P in LoreStringName]?: unknown
} & {
  version: number
}

export class WorldEditTool<LoreFormat extends LoreFormatType = LoreFormatType> {
  static loreBlockSetKeys: string[] = LORE_BLOCKS_SET_KEYS_T

  static tools: WorldEditTool[] = []

  static intervals: IntervalFunction[] = []

  command

  displayName

  editToolForm

  interval0

  interval10

  interval20

  itemId

  loreFormat

  name

  onUse

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
  }: {
    name: string
    displayName: string
    itemStackId: string
    editToolForm?: (slot: ContainerSlot, player: Player, initial?: boolean) => void
    loreFormat?: LoreFormat
    interval0?: IntervalFunction
    interval10?: IntervalFunction
    interval20?: IntervalFunction
    onUse?: (player: Player, item: ItemStack) => void
    overrides?: Partial<WorldEditTool<LoreFormat>> & ThisType<WorldEditTool<LoreFormat>>
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
    if (overrides) expand(this, overrides)

    this.command = new Command(name)
      .setDescription(`Создает${editToolForm ? ' или редактирует ' : ''}${displayName}`)
      .setPermissions('builder')
      .setGroup('we')
      .executes(ctx => {
        const slotOrError = this.getToolSlot(ctx.player)

        if (typeof slotOrError === 'string') ctx.error(slotOrError)
        else if (this.editToolForm) this.editToolForm(slotOrError, ctx.player, true)
      })
  }

  /** @param {Player} player */

  getToolSlot(player: Player) {
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

  getMenuButtonNameColor(player: Player): string {
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId
    const air = !typeId
    return edit ? '§2' : air ? '' : '§8'
  }

  /**
   * @param {Player} player
   * @returns {string}
   */

  getMenuButtonName(player: Player): string {
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId

    if (!this.editToolForm && edit) return ''

    return `${this.getMenuButtonNameColor(player)}${edit ? 'Редактировать' : 'Создать'} ${this.displayName}`
  }

  parseLore(lore: string[], returnUndefined?: false): LoreFormat

  parseLore(lore: string[], returnUndefined?: true): LoreFormat | undefined

  parseLore(lore: string[], returnUndefined = false): LoreFormat | undefined {
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
  loreTranslation: Record<string, string> = {
    shape: 'Форма',
    size: 'Размер',
    height: 'Высота',
    maxDistance: 'Расстояние',
    blocksSet: 'Блоки',
    replaceBlocksSet: 'Заменяет',
    radius: 'Радиус',
    zone: 'Отступ',
  }

  /**
   * @param {LoreFormat} format
   * @returns {string[]}
   */
  stringifyLore(format: LoreFormat): string[] {
    format.version ??= this.loreFormat.version
    return [
      ...Object.entries(format)
        .filter(([key]) => key !== 'version')
        .map(([key, value]) => {
          const val = WorldEditTool.loreBlockSetKeys.includes(key)
            ? stringifyBlocksSetRef(value as BlocksSetRef)
            : util.inspect(value)

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

      const fn: (undefined | IntervalFunction)[] = [tool.interval0]

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
