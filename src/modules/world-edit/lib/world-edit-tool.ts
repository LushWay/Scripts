import {
  Block,
  ContainerSlot,
  ItemStack,
  ItemTypes,
  Player,
  PlayerInteractWithBlockBeforeEvent,
  system,
  world,
} from '@minecraft/server'
import { Command, inspect, isKeyof, noBoolean, stringify, util } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { noI18n, textUnitColorize } from 'lib/i18n/text'
import { BlocksSetRef, stringifyBlocksSetRef } from 'modules/world-edit/utils/blocks-set'
import { worldEditPlayerSettings } from '../settings'

export type WorldEditToolInterval<T> = (
  player: Player,
  storage: T,
  slot: ContainerSlot,
  settings: ReturnType<typeof worldEditPlayerSettings>,
) => void

type StorageKey =
  | 'blocksSet'
  | 'replaceBlocksSet'
  | 'height'
  | 'size'
  | 'shape'
  | 'maxDistance'
  | 'offset'
  | 'replaceMode'
  | 'type'
  | 'radius'
  | 'blending'
  | 'factor'
  | 'activator'

const LORE_SEPARATOR = '\u00a0'

type StorageType = Partial<Record<StorageKey, any>> & {
  version: number
}

export abstract class WorldEditTool<Storage extends StorageType = any> {
  static loreBlockRefKeys: string[] = ['blocksSet', 'replaceBlocksSet'] satisfies StorageKey[]
  static tools: WorldEditTool[] = []

  abstract id: string
  abstract name: string
  abstract typeId: string
  abstract storageSchema: Storage

  private command?: Command

  editToolForm?(this: WorldEditTool<Storage>, slot: ContainerSlot, player: Player, initial?: boolean): void {
    this.saveStorage(slot, this.storageSchema)
  }
  onUse?(player: Player, item: ItemStack, storage: Storage): void
  onUseOnBlock?(player: Player, item: ItemStack, block: Block, storage: Storage): void

  onGlobalInterval(ticks: 'global', interval: WorldEditToolInterval<Storage | undefined>): void {
    this[`interval${ticks}`] = interval
  }
  onInterval(ticks: 0 | 10 | 20, interval: WorldEditToolInterval<Storage>): void {
    this[`interval${ticks}`] = interval
  }

  interval0?: WorldEditToolInterval<Storage>
  interval10?: WorldEditToolInterval<Storage>
  interval20?: WorldEditToolInterval<Storage>
  intervalglobal?: WorldEditToolInterval<Storage | undefined>

  constructor() {
    WorldEditTool.tools.push(this)
    system.delay(() => this.createCommand())
  }

  createCommand() {
    if (this.command) return this.command

    this.command = new Command(this.id)
      .setDescription(`Создает${this.editToolForm ? ' или редактирует ' : ''}${this.name}`)
      .setPermissions('builder')
      .setGroup('we')
      .executes(ctx => {
        const slotOrError = this.getToolSlot(ctx.player)

        if (typeof slotOrError === 'string') ctx.error(slotOrError)
        else if (this.editToolForm) this.editToolForm(slotOrError, ctx.player, true)
      })

    return this.command
  }

  isOurItemType(slot: ContainerSlot | ItemStack) {
    return (
      slot.typeId === this.typeId &&
      (!!this.getStorage(slot, true) || // Has our storage
        slot.getDynamicPropertyIds().length === 0) // Or doesnt have storage at all
    )
  }

  getToolSlot(player: Player) {
    const slot = player.mainhand()

    if (!slot.typeId) {
      const item = ItemTypes.get(this.typeId)
      if (!item) throw new TypeError(`ItemType '${this.typeId}' does not exists`)
      slot.setItem(new ItemStack(item))
      return slot
    } else if (this.isOurItemType(slot)) {
      return slot
    } else {
      return `Выбери пустой слот чтобы создать ${this.name} или возьми для настройки!`
    }
  }

  getMenuButtonName(player: Player): string {
    const slot = player.mainhand()
    const our = this.isOurItemType(slot)

    if (!this.editToolForm && our) return ''

    const empty = !slot.typeId
    const color = our ? '§a' : empty ? '' : '§8'

    return `${color}${our ? 'Редактировать' : 'Создать'} ${this.name}`
  }

  private get storageProperty() {
    return `we:tool:${this.id}`
  }

  translation: Record<StorageKey, string> = {
    shape: 'Форма',
    size: 'Размер',
    height: 'Высота',
    maxDistance: 'Расстояние',
    blocksSet: 'Блоки',
    replaceBlocksSet: 'Заменяет',
    replaceMode: 'Режим замены',
    radius: 'Радиус',
    offset: 'Отступ',
    type: 'Тип',
    blending: 'Смешивание',
    factor: 'Фактор смешивания',
    activator: 'Активатор',
  }

  getStorage(slot: ContainerSlot | ItemStack, returnUndefined?: false): Storage
  getStorage(slot: ContainerSlot | ItemStack, returnUndefined: true): Storage | undefined
  getStorage(slot: ContainerSlot | ItemStack, returnUndefined = false): Storage | undefined {
    const property = slot.getDynamicProperty(this.storageProperty)
    const propertyParsed = typeof property === 'string' ? this.parse(property, true) : undefined
    return propertyParsed ?? this.parseLore(slot, returnUndefined as true)
  }

  saveStorage(slot: ContainerSlot | ItemStack, storage: Storage, writeLore = true) {
    slot.setDynamicProperty(this.storageProperty, JSON.stringify({ ...storage, version: this.storageSchema.version }))

    if (!writeLore) return

    const table = Object.entries(storage)
      .map(([key, value]) => {
        if (!isKeyof(key, this.translation)) return false

        const translatedKey = this.translation[key]
        const fullValue = WorldEditTool.loreBlockRefKeys.includes(key)
          ? stringifyBlocksSetRef(value as BlocksSetRef)
          : stringify(value)

        return `§7${translatedKey}: ${textUnitColorize(fullValue, undefined, false)}`
      })
      .filter(noBoolean)

    slot.setLore([' ', ...table.map(e => `§r${noI18n`${e[0]}: ${e[1]}`.slice(0, 48)}`)])
  }

  /** @deprecated */
  private parseLore(slot: ContainerSlot | ItemStack, returnUndefined = false): Storage | undefined {
    let lore: string[] = []
    try {
      lore = slot.getLore()
    } catch {}

    return this.parse(
      lore
        .slice(lore.findIndex(e => e.includes(LORE_SEPARATOR)) + 1)
        .join('')
        .replace(/§(.)/g, '$1'),
      returnUndefined as true,
    )
  }

  private parse(storageData: string, returnUndefined?: false): Storage
  private parse(storageData: string, returnUndefined: true): Storage | undefined
  private parse(storageData: string, returnUndefined = false): Storage | undefined {
    let raw
    try {
      raw = JSON.parse(storageData) as Storage
    } catch {}
    if (typeof raw === 'undefined' && returnUndefined) return undefined

    if (typeof this.storageSchema !== 'object') {
      this.storageSchema = { version: 1 } as Storage
    }

    if (raw?.version !== this.storageSchema.version) {
      if (returnUndefined) return undefined
      raw = JSON.parse(JSON.stringify(this.storageSchema)) as Storage
    }

    if ('version' in raw) Reflect.deleteProperty(raw, 'version')
    return Object.setPrototypeOf(raw, this.storageSchema) as typeof raw
  }

  /** @deprecated */
  stringifyLore(format: Storage): string[] {
    return [
      ...Object.entries(format)
        .filter(([key]) => key !== 'version')
        .map(([key, value]) => {
          const val = WorldEditTool.loreBlockRefKeys.includes(key)
            ? stringifyBlocksSetRef(value as BlocksSetRef)
            : inspect(value)

          const k = isKeyof(key, this.translation) ? this.translation[key] : key
          return `${k}: ${val}`.match(/.{0,48}/g) ?? []
        })
        .flat()
        .filter(Boolean)
        .map(e => '§r§f' + e),

      LORE_SEPARATOR,

      ...(JSON.stringify({ ...format, version: this.storageSchema.version })
        .split('')
        .map(e => '§' + e)
        .join('')
        .match(/.{0,50}/g) ?? []),
    ]
  }

  private static ticks = 0

  static {
    this.onUseEvent('itemUse')
    this.onUseEvent('playerInteractWithBlock')
    this.intervalsJob()
  }

  private static onUseEvent(event: 'itemUse' | 'playerInteractWithBlock') {
    const property =
      event === 'itemUse' ? ('onUse' satisfies keyof WorldEditTool) : ('onUseOnBlock' satisfies keyof WorldEditTool)

    world[event === 'playerInteractWithBlock' ? 'beforeEvents' : 'afterEvents'][event].subscribe(someEvent => {
      const { itemStack: item } = someEvent
      const player = 'player' in someEvent ? someEvent.player : someEvent.source
      if (!(player instanceof Player) || !item) return

      for (const tool of WorldEditTool.tools) {
        if (!tool[property] || !tool.isOurItemType(item)) continue

        const storage = tool.getStorage(item, true) as unknown
        const create = typeof storage === 'undefined' ? this.create : undefined

        if (property === 'onUse') {
          if (create) return create(tool, player)
          tool[property](player, item, storage)
        } else {
          const event = someEvent as PlayerInteractWithBlockBeforeEvent
          if (!event.isFirstEvent) return

          event.cancel = true
          system.delay(() => {
            if (create) return create(tool, player)
            tool[property]?.(player, item, event.block, storage)
          })
        }
      }
    })
  }

  private static create(this: void, tool: WorldEditTool, player: Player) {
    if (tool.editToolForm) {
      tool.editToolForm(player.mainhand(), player)
    } else player.onScreenDisplay.setActionBar('§cИспользуй .we', ActionbarPriority.High)
  }

  private static intervalsJob() {
    system.runJob(this.createJob())
  }

  private static *createJob() {
    try {
      for (const player of world.getAllPlayers()) {
        if (!player.isValid) continue

        const slot = player.mainhand()
        const tools = WorldEditTool.tools.filter(e => e.typeId === slot.typeId)
        const settings = worldEditPlayerSettings(player)

        WorldEditTool.tools.forEach(tool =>
          util.catch(() => tool.intervalglobal?.(player, tool.getStorage(slot, true), slot, settings)),
        )
        for (const tool of tools) {
          const storage = tool.getStorage(slot, true) as unknown
          if (!storage) continue

          const fn: (undefined | OmitThisParameter<WorldEditToolInterval<any>>)[] = [tool.interval0?.bind(tool)]
          if (this.ticks % 10 === 0) fn.push(tool.interval10?.bind(tool))
          if (this.ticks % 20 === 0) fn.push(tool.interval20?.bind(tool))
          fn.forEach(e => e && util.catch(() => e(player, storage, slot, settings)))
        }
        yield
      }
    } catch (e) {
      console.error(e)
    } finally {
      this.intervalsJob()
      if (this.ticks >= 20) this.ticks = 0
      else this.ticks++
    }
  }
}
