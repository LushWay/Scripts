import { ContainerSlot, ItemStack, ItemTypes, Player, system, world } from '@minecraft/server'
import { expand, inspect, util } from 'lib'
import { BlocksSetRef, stringifyBlocksSetRef } from 'modules/world-edit/utils/blocks-set'
import { worldEditPlayerSettings } from '../settings'

type IntervalFunction<T extends LoreFormatType> = (
  this: WorldEditTool<T>,
  player: Player,
  slot: ContainerSlot,
  settings: ReturnType<typeof worldEditPlayerSettings>,
) => void
type LoreStringName = 'blocksSet' | 'replaceBlocksSet' | 'height' | 'size' | 'shape' | 'maxDistance' | 'zone'

const LORE_SEPARATOR = '\u00a0'

type LoreFormatType = {
  [P in LoreStringName]?: unknown
} & {
  version: number
}

export class WorldEditTool<LoreFormat extends LoreFormatType = LoreFormatType> {
  static loreBlockSetKeys: string[] = ['blocksSet', 'replaceBlocksSet'] satisfies LoreStringName[]

  static tools: WorldEditTool<any>[] = []

  static intervals: OmitThisParameter<IntervalFunction<any>>[] = []

  command

  name

  editToolForm

  interval0

  interval10

  interval20

  itemId

  loreFormat

  id

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
    id,
    name,
    itemStackId,
    editToolForm,
    loreFormat,
    interval0,
    interval10,
    interval20,
    onUse,
    overrides,
  }: {
    id: string
    name: string
    itemStackId: string
    editToolForm?: (this: WorldEditTool<LoreFormat>, slot: ContainerSlot, player: Player, initial?: boolean) => void
    loreFormat?: LoreFormat
    interval0?: IntervalFunction<LoreFormat>
    interval10?: IntervalFunction<LoreFormat>
    interval20?: IntervalFunction<LoreFormat>
    onUse?: (player: Player, item: ItemStack) => void
    overrides?: Partial<WorldEditTool<LoreFormat>> & ThisType<WorldEditTool<LoreFormat>>
  }) {
    WorldEditTool.tools.push(this)
    this.id = id
    this.name = name
    this.itemId = itemStackId
    if (editToolForm) this.editToolForm = editToolForm
    this.loreFormat = loreFormat ?? { version: 0 }
    ;(this.loreFormat as Partial<LoreFormat>).version ??= 0
    this.onUse = onUse
    this.interval0 = interval0
    this.interval10 = interval10
    this.interval20 = interval20
    if (overrides) expand(this, overrides)

    this.command = new Command(id)
      .setDescription(`Создает${editToolForm ? ' или редактирует ' : ''}${name}`)
      .setPermissions('builder')
      .setGroup('we')
      .executes(ctx => {
        const slotOrError = this.getToolSlot(ctx.player)

        if (typeof slotOrError === 'string') ctx.error(slotOrError)
        else if (this.editToolForm) this.editToolForm(slotOrError, ctx.player, true)
      })
  }

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
      return `Выбери пустой слот чтобы создать ${this.name} или возьми для настройки!`
    }
  }

  getMenuButtonNameColor(player: Player): string {
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId
    const air = !typeId
    return edit ? '§2' : air ? '' : '§8'
  }

  getMenuButtonName(player: Player): string {
    const { typeId } = player.mainhand()
    const edit = typeId === this.itemId

    if (!this.editToolForm && edit) return ''

    return `${this.getMenuButtonNameColor(player)}${edit ? 'Редактировать' : 'Создать'} ${this.name}`
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
      ) as LoreFormat
    } catch {}
    if (raw?.version !== this.loreFormat.version) {
      if (returnUndefined) return undefined
      raw = JSON.parse(JSON.stringify(this.loreFormat)) as LoreFormat
    }

    if ('version' in raw) Reflect.deleteProperty(raw, 'version')
    return raw
  }

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

  stringifyLore(format: LoreFormat): string[] {
    ;(format as Partial<LoreFormat>).version ??= this.loreFormat.version
    return [
      ...Object.entries(format)
        .filter(([key]) => key !== 'version')
        .map(([key, value]) => {
          const val = WorldEditTool.loreBlockSetKeys.includes(key)
            ? stringifyBlocksSetRef(value as BlocksSetRef)
            : inspect(value)

          const k = this.loreTranslation[key] ?? key
          return `${k}: ${val}`.match(/.{0,48}/g) ?? []
        })
        .flat()
        .filter(Boolean)
        .map(e => '§r§f' + e),

      LORE_SEPARATOR,

      ...(JSON.stringify(format)
        .split('')
        .map(e => '§' + e)
        .join('')
        .match(/.{0,50}/g) ?? []),
    ]
  }
}

world.afterEvents.itemUse.subscribe(({ source: player, itemStack: item }) => {
  if (!(player instanceof Player)) return
  WorldEditTool.tools
    .filter(e => e.itemId === item.typeId)
    .forEach(tool => util.catch(() => tool.onUse?.(player, item)))
})

let ticks = 0
run()
function run() {
  system.run(() => {
    system.runJob(
      (function* () {
        for (const player of world.getAllPlayers()) {
          if (!player.isValid()) continue

          const item = player.mainhand()
          const tools = WorldEditTool.tools.filter(e => e.itemId === item.typeId)
          const settings = worldEditPlayerSettings(player)

          WorldEditTool.intervals.forEach(e => e(player, item, settings))
          for (const tool of tools) {
            const fn: (undefined | OmitThisParameter<IntervalFunction<any>>)[] = [tool.interval0?.bind(tool)]

            if (ticks % 10 === 0) fn.push(tool.interval10?.bind(tool))
            if (ticks % 20 === 0) fn.push(tool.interval20?.bind(tool))
            fn.forEach(e => e?.(player, item, settings))
          }
          yield
        }
        if (ticks >= 20) ticks = 0
        else ticks++
        run()
      })(),
    )
  })
}
