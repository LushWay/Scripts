import * as mc from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import { EventSignal } from 'lib/event-signal'
import { vi } from 'vitest'

export abstract class Component {
  abstract readonly typeId: string

  isValid(): boolean {
    return true
  }
}

export class BlockTypes {
  static getAll() {
    return []
  }
}

export abstract class ItemComponent extends Component {
  abstract readonly componentId: string

  get typeId() {
    return this.componentId
  }
}
export class ItemCooldownComponent extends ItemComponent {
  componentId = 'minecraft:cooldown' as const
}
export class ItemEnchantableComponent extends ItemComponent {
  componentId = 'minecraft:enchantable' as const
}
export class ItemDurabilityComponent extends ItemComponent {
  componentId = 'minecraft:durability' as const
}
export class ItemFoodComponent extends ItemComponent {
  componentId = 'minecraft:food' as const
}

export abstract class EntityComponent extends Component {
  abstract readonly typeId: string

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

export enum EquipmentSlot {
  Chest = 'Chest',
  Feet = 'Feet',
  Head = 'Head',
  Legs = 'Legs',
  Mainhand = 'Mainhand',
  Offhand = 'Offhand',
}

export class EntityEquippableComponent extends EntityComponent {
  static readonly componentId = 'minecraft:equippable'
  readonly typeId = 'minecraft:equippable'

  private container = new Container(Object.keys(EquipmentSlot).length)
  private slots: Record<EquipmentSlot, ContainerSlot> = Object.fromEntries(
    Object.values(EquipmentSlot).map((e, i) => [e, new ContainerSlot(i, this.container)]),
  )

  getEquipment(equipmentSlot: EquipmentSlot): ItemStack | undefined {
    return this.getEquipmentSlot(equipmentSlot).getItem()
  }

  getEquipmentSlot(equipmentSlot: EquipmentSlot): ContainerSlot {
    return this.slots[equipmentSlot]
  }

  setEquipment(equipmentSlot: EquipmentSlot, itemStack?: ItemStack): boolean {
    this.getEquipmentSlot(equipmentSlot).setItem(itemStack)
    return true
  }
}

export class Entity {
  id = 'test entity id'
  nameTag = 'test entity nameTag'
  teleport = vi.fn()

  private readonly components: EntityComponent[] = [
    new EntityInventoryComponent(this, 0, false, 'entity', 32, false, false),
    new EntityEquippableComponent(this),
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
  constructor(initialSpawn = true) {
    super()
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerJoin as unknown as EventSignal<any>,
      { playerId: this.id, playerName: this.name } as mc.PlayerJoinAfterEvent,
    )
    EventSignal.emit(
      (world.afterEvents as unknown as mc.WorldAfterEvents).playerSpawn as unknown as EventSignal<any>,
      { player: this as unknown as mc.Player, initialSpawn } as mc.PlayerSpawnAfterEvent,
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
  getRotation() {
    return { x: 0, y: 0 }
  }

  location = { x: 0, y: 0, z: 0 }

  private properties: Record<string, any> = {}

  setProperty(p: string, v: any) {
    this.properties[p] = v
  }

  getProperty(p: string) {
    return this.properties[p]
  }

  hasProperty(p: string) {
    return p in this.properties
  }
}

export class System {
  delay(fn: VoidFunction) {
    return this.run(fn)
  }

  run(fn: VoidFunction) {
    // @ts-ignore
    setImmediate(fn)
    return 0
  }

  runInterval() {
    return 0
  }
  runTimeout() {
    return 0
  }
  runJob(job: Generator) {
    for (const a of job) {
    }
    return 0
  }

  beforeEvents = new SystemBeforeEvents()
}

export enum WatchdogTerminateReason {
  Hang = 'Hang',
  StackOverflow = 'StackOverflow',
}

export class SystemBeforeEvents {
  readonly watchdogTerminate = new EventSignal<{ cancel: boolean; terminateReason: WatchdogTerminateReason }>()
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

/** Contains objectives and participants for the scoreboard. */
export class Scoreboard {
  objectives: ScoreboardObjective[] = []

  addObjective(objectiveId: string, displayName?: string): ScoreboardObjective {
    const obj = new ScoreboardObjective(objectiveId, displayName)
    this.objectives.push(obj)
    return obj
  }
  clearObjectiveAtDisplaySlot(displaySlotId: any): ScoreboardObjective | undefined {
    return
  }
  getObjective(objectiveId: string): ScoreboardObjective | undefined {
    return this.objectives.find(e => e.id === objectiveId)
  }

  getObjectiveAtDisplaySlot(displaySlotId: any) {
    return
  }
  getObjectives(): ScoreboardObjective[] {
    return []
  }
  getParticipants(): ScoreboardIdentity[] {
    return []
  }
  removeObjective(objectiveId: ScoreboardObjective | string): boolean {
    return false
  }

  setObjectiveAtDisplaySlot(displaySlotId: any, objectiveDisplaySetting: any): ScoreboardObjective | undefined {
    return
  }
}

/** Contains an identity of the scoreboard item. */
export class ScoreboardIdentity {
  readonly 'displayName': string
  readonly 'id': number
  readonly 'type': any
  'getEntity'(): Entity | undefined {
    return
  }
  'isValid'() {
    return false
  }
}

export class ScoreboardObjective {
  constructor(
    readonly id: string,
    displayName?: string,
  ) {}

  private participiants = new Map<string, number>()

  private getId(p: Entity | ScoreboardIdentity | string) {
    return p instanceof Entity ? p.id : p instanceof ScoreboardIdentity ? p.id + '' : p
  }

  addScore(participant: Entity | ScoreboardIdentity | string, scoreToAdd: number): number {
    const score = this.participiants.get(this.getId(participant))
    if (typeof score !== 'undefined') {
      this.participiants.set(this.getId(participant), score + scoreToAdd)
    }
    return scoreToAdd
  }
  getParticipants(): ScoreboardIdentity[] {
    return []
  }
  getScore(participant: Entity | ScoreboardIdentity | string): number | undefined {
    return this.participiants.get(this.getId(participant))
  }
  getScores(): any[] {
    return []
  }
  hasParticipant(participant: Entity | ScoreboardIdentity | string): boolean {
    return this.participiants.has(this.getId(participant))
  }
  isValid(): boolean {
    return true
  }
  removeParticipant(participant: Entity | ScoreboardIdentity | string): boolean {
    return false
  }
  setScore(participant: Entity | ScoreboardIdentity | string, score: number): void {
    this.participiants.set(this.getId(participant), score)
  }
}

export class World {
  scoreboard = new Scoreboard()
  afterEvents = wrapEvents(new WorldAfterEvents())
  beforeEvents = wrapEvents(new WorldBeforeEvents())
  sendMessage = vi.fn()
  say = vi.fn()
  getPlayers() {
    return []
  }

  getAllPlayers() {
    return []
  }

  getDimension(id: MinecraftDimensionTypes) {
    return new Dimension(id)
  }

  getDynamicProperty() {
    return undefined
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

export class ItemTypes {
  static get(itemId: string): ItemType | undefined {
    return new ItemType(itemId)
  }
  static getAll(): ItemType[] {
    return []
  }
}

export class ItemType {
  constructor(readonly id: string) {}
}

export class ItemStack extends DynamicPropertiesProvider {
  nameTag: string | undefined
  getComponent() {
    return
  }
  typeId: string
  readonly type: ItemType

  constructor(itemType: mc.ItemType | string, amount: number = 1) {
    super()
    this.amount = amount
    this.typeId = typeof itemType === 'string' ? itemType : itemType.id
    this.type = typeof itemType === 'string' ? new ItemType(itemType) : itemType
  }

  _amount: number = 1

  get amount() {
    return this._amount
  }

  set amount(amount: number) {
    if (amount < 0 || amount > 64) throw new RangeError(`Item amount should be in range [0, 64], recieved ${amount}`)
    this._amount = amount
  }

  private lore: string[] = []
  getLore() {
    return this.lore.slice()
  }
  setLore(lore: string[]) {
    this.lore = lore
  }

  clone() {
    const item = new ItemStack(this.typeId, this.amount)
    Object.assign(item, this)
    return item
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
  constructor(
    private slot: number,
    private container: Container,
  ) {
    return new Proxy(this, {
      get: (target, p, receiver) => {
        if (p in target) {
          return Reflect.get(target, p, receiver)
        } else {
          if (!this.hasItem()) return
          return Reflect.get(this.item, p, this.item)
        }
      },
      set: (target, p, receiver) => {
        if (p in target) {
          return Reflect.set(target, p, receiver)
        } else {
          if (!this.hasItem()) return true
          return Reflect.set(this.item, p, this.item)
        }
      },
    })
  }

  private get item() {
    const item = this.container.getItem(this.slot, false)
    if (!item) throw new Error('No item')
    return item
  }

  getItem(): ItemStack | undefined {
    if (!this.hasItem()) return undefined
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
    return new ContainerSlot(slot, this)
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

/** The types of item components that are accessible via function ItemStack.getComponent. */
export enum ItemComponentTypes {
  /**
   * @remarks
   *   The minecraft:cooldown component.
   */
  Cooldown = 'minecraft:cooldown',
  /**
   * @remarks
   *   The minecraft:durability component.
   */
  Durability = 'minecraft:durability',
  /**
   * @remarks
   *   The minecraft:enchantable component.
   */
  Enchantable = 'minecraft:enchantable',
  /**
   * @remarks
   *   The minecraft:food component.
   */
  Food = 'minecraft:food',
}

/** Describes how an an item can be moved within a container. */
export enum ItemLockMode {
  /**
   * @remarks
   *   The item cannot be dropped or crafted with.
   */
  inventory = 'inventory',
  /**
   * @remarks
   *   The item has no container restrictions.
   */
  none = 'none',
  /**
   * @remarks
   *   The item cannot be moved from its slot, dropped or crafted with.
   */
  slot = 'slot',
}
