import * as mc from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import { EventSignal } from 'lib/event-signal'
import { vi } from 'vitest'

export class Component {
  readonly 'typeId': string
  'isValid'(): boolean {
    return true
  }
}

export class EntityComponent extends Component {
  constructor(readonly entity: Entity) {
    super()
  }
}

export class EntityInventoryComponent extends EntityComponent {
  'constructor'(
    entity: Entity,
    readonly additionalSlotsPerStrength: number,
    readonly canBeSiphonedFrom: boolean,
    readonly containerType: string,
    readonly inventorySize: number,
    isPrivate: boolean,
    readonly restrictToOwner: boolean,
  ) {
    super(entity)
    this.private = isPrivate
  }

  readonly 'typeId' = EntityInventoryComponent.componentId
  readonly 'private': boolean
  readonly 'container' = new Container(this.inventorySize)
  static readonly 'componentId' = 'minecraft:inventory'
}

export class Entity {
  id = 'test entity id'
  nameTag = 'test entity nameTag'
  teleport = vi.fn()

  private readonly components: EntityComponent[] = [
    new EntityInventoryComponent(this, 0, false, 'entity', 32, false, false),
  ]

  getComponent(name: string) {
    return this.components.find(e => e.typeId.replace('minecraft:', '') === name.replace('minecraft:', ''))
  }
  getComponents() {
    return [...this.components.values()]
  }

  isValid() {
    return true
  }
}

export class Player extends Entity {
  scores = new Proxy(
    {},
    {
      get(target, p, receiver) {
        return Reflect.get(target, p, receiver) ?? 0
      },
    },
  )
  constructor() {
    super()
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerJoin as unknown as EventSignal<any>,
      { playerId: this.id, playerName: this.name } as mc.PlayerJoinAfterEvent,
    )
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerSpawn as unknown as EventSignal<any>,
      { player: this as unknown as mc.Player, initialSpawn: true } as mc.PlayerSpawnAfterEvent,
    )
  }

  id = 'test player id'
  name = 'Test player name'
  nameTag = this.name
  playSound = vi.fn()

  private gamemode: GameMode = GameMode.survival
  getGameMode() {
    return this.gamemode
  }
  setGameMode(gameMode: GameMode) {
    this.gamemode = gameMode
  }
}

export class System {
  delay(fn: VoidFunction) {
    return this.run(fn)
  }

  run(fn: VoidFunction) {
    setImmediate(fn)
    return 0
  }

  runInterval = vi.fn()
  runTimeout = vi.fn()
  runJob = vi.fn()
}

export const system = new System()

function wrapEvents(events: WorldAfterEvents | WorldBeforeEvents) {
  return new Proxy(events as Record<string, EventSignal<any>>, {
    get(target, p, receiver) {
      if (typeof p === 'symbol') return Reflect.get(target, p, receiver)
      if (target[p]) return target[p]

      target[p] = new EventSignal()
      return target[p]
    },
  })
}

export class World {
  afterEvents = wrapEvents(new WorldAfterEvents())
  beforeEvents = wrapEvents(new WorldBeforeEvents())
  sendMessage = vi.fn()
  getPlayers() {
    return []
  }
  getDimension(id: MinecraftDimensionTypes) {
    return new Dimension(id)
  }
}

type DynamicPropertyValue = string | number | boolean | undefined | Vector3

class DynamicPropertiesProvider {
  private dynamicProperties: Record<string, DynamicPropertyValue> = {}
  getDynamicProperty(key: string) {
    return this.dynamicProperties[key]
  }
  setDynamicProperty(key: string, value: DynamicPropertyValue) {
    if (value === undefined) Reflect.deleteProperty(this.dynamicProperties, key)
    else this.dynamicProperties[key] = value
  }
  getDynamicPropertiesIds() {
    return Object.keys(this.dynamicProperties)
  }
}

export class WorldAfterEvents {}
export class WorldBeforeEvents {}

export const world = new World()

export class ItemType {
  constructor(readonly id: string) {}
}

export class ItemStack extends DynamicPropertiesProvider {
  typeId: string
  readonly type: ItemType

  constructor(
    itemType: mc.ItemType | string,
    public amount: number = 1,
  ) {
    super()
    this.typeId = typeof itemType === 'string' ? itemType : itemType.id
    this.type = typeof itemType === 'string' ? new ItemType(itemType) : itemType
  }

  private lore: string[] = []
  getLore() {
    return this.lore.slice()
  }
  setLore(lore: string[]) {
    this.lore = lore
  }

  clone() {
    return new ItemStack(this.typeId, this.amount)
  }

  maxAmount = 64

  isStackableWith(itemStack: ItemStack): boolean {
    return itemStack.typeId === this.typeId && this.amount + itemStack.amount < this.maxAmount
  }
}

export class Dimension {
  heightRange = {
    min: -64,
    max: 365,
  }

  constructor(public id: MinecraftDimensionTypes) {}
}

export enum GameMode {
  adventure = 'adventure',
  creative = 'creative',
  spectator = 'spectator',
  survival = 'survival',
}

export class ContainerSlot {
  static create(slot: number, container: Container) {
    const containerSlot = new this(slot, container)
    return new Proxy(containerSlot, {
      get(target, p, receiver) {
        if (p in target) {
          return Reflect.get(target, p, receiver)
        } else {
          return Reflect.get(containerSlot.item, p, containerSlot.item)
        }
      },
      set(target, p, receiver) {
        if (p in target) {
          return Reflect.set(target, p, receiver)
        } else {
          return Reflect.set(containerSlot.item, p, containerSlot.item)
        }
      },
    })
  }

  private constructor(
    private slot: number,
    private container: Container,
  ) {}

  private get item() {
    const item = this.container.getItem(this.slot, false)
    if (!item) throw new Error('No item')
    return item
  }

  getItem(): ItemStack | undefined {
    if (!this.hasItem()) throw new Error('No item')
    return this.container.getItem(this.slot)
  }

  hasItem(): boolean {
    return !!this.container.getItem(this.slot)
  }

  setItem(itemStack?: ItemStack): void {
    this.container.setItem(this.slot, itemStack)
  }

  get amount() {
    return this.item.amount
  }

  set amount(a: number) {
    this.item.amount = a
  }
}

export class Container {
  private readonly storage = new Map<number, ItemStack>()
  constructor(readonly size: number) {}

  get emptySlotsCount() {
    return this.size - this.storage.size
  }

  addItem(itemStack: ItemStack): ItemStack | undefined {
    for (let i = 0; i < this.size; i++) {
      const item = this.getItem(i)
      if (!item?.isStackableWith(itemStack)) continue
      ;(this.storage.get(i) as unknown as ItemStack).amount += itemStack.amount
      return itemStack
    }

    for (let i = 0; i < this.size; i++) {
      if (this.getItem(i)) continue
      this.setItem(i, itemStack)
      return itemStack
    }
  }

  clearAll(): void {
    this.storage.clear()
  }

  getItem(slot: number, clone = true): ItemStack | undefined {
    const item = this.storage.get(slot)
    return clone ? item?.clone() : item
  }

  getSlot(slot: number): ContainerSlot {
    return ContainerSlot.create(slot, this)
  }

  isValid(): boolean {
    return true
  }

  moveItem(fromSlot: number, toSlot: number, toContainer: Container): void {
    const item = this.getItem(fromSlot)
    if (item) this.setItem(fromSlot, undefined)

    toContainer.setItem(toSlot, item)
  }

  setItem(slot: number, itemStack?: ItemStack): void {
    if (!itemStack) {
      this.storage.delete(slot)
    } else this.storage.set(slot, itemStack)
  }

  swapItems(slot: number, otherSlot: number, otherContainer: Container): void {
    const item = this.getItem(slot)
    if (!item) return

    this.setItem(slot, undefined)
    otherContainer.setItem(otherSlot, item)
  }

  transferItem(fromSlot: number, toContainer: Container): ItemStack | undefined {
    const item = this.getItem(fromSlot)
    if (!item) return

    this.setItem(fromSlot, undefined)
    return toContainer.addItem(item)
  }
}
