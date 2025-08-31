import * as mc from '@minecraft/server'
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data'
import { EventSignal } from 'lib/event-signal'

export abstract class Component {
  abstract readonly typeId: string

  isValid = true
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

export enum EnchantmentSlot {
  ArmorFeet = 'ArmorFeet',
  ArmorHead = 'ArmorHead',
  ArmorLegs = 'ArmorLegs',
  ArmorTorso = 'ArmorTorso',
  Axe = 'Axe',
  Bow = 'Bow',
  CarrotStick = 'CarrotStick',
  CosmeticHead = 'CosmeticHead',
  Crossbow = 'Crossbow',
  Elytra = 'Elytra',
  FishingRod = 'FishingRod',
  Flintsteel = 'Flintsteel',
  Hoe = 'Hoe',
  Pickaxe = 'Pickaxe',
  Shears = 'Shears',
  Shield = 'Shield',
  Shovel = 'Shovel',
  Spear = 'Spear',
  Sword = 'Sword',
}

/** The types of entity components that are accessible via function Entity.getComponent. */
export enum EntityComponentTypes {
  /**
   * @remarks
   *   When added, this component makes the entity spawn with a rider of the specified entityType.
   */
  AddRider = 'minecraft:addrider',
  /**
   * @remarks
   *   Adds a timer for the entity to grow up. It can be accelerated by giving the entity the items it likes as defined by
   *   feedItems.
   */
  Ageable = 'minecraft:ageable',
  /**
   * @remarks
   *   Defines what blocks this entity can breathe in and gives them the ability to suffocate.
   */
  Breathable = 'minecraft:breathable',
  /**
   * @remarks
   *   When added, this component signifies that the entity can climb up ladders.
   */
  CanClimb = 'minecraft:can_climb',
  /**
   * @remarks
   *   When added, this component signifies that the entity can fly, and the pathfinder won't be restricted to paths where
   *   a solid block is required underneath it.
   */
  CanFly = 'minecraft:can_fly',
  /**
   * @remarks
   *   When added, this component signifies that the entity can power jump like the horse does within Minecraft.
   */
  CanPowerJump = 'minecraft:can_power_jump',
  /**
   * @remarks
   *   Defines the entity's color. Only works on certain entities that have predefined color values (e.g., sheep, llama,
   *   shulker).
   */
  Color = 'minecraft:color',
  /**
   * @remarks
   *   Defines the entity's secondary color. Only works on certain entities that have predefined secondary color values
   *   (e.g., tropical fish).
   */
  Color2 = 'minecraft:color2',
  CursorInventory = 'minecraft:cursor_inventory',
  /**
   * @remarks
   *   Provides access to a mob's equipment slots. This component exists for all mob entities.
   */
  Equippable = 'minecraft:equippable',
  /**
   * @remarks
   *   When added, this component signifies that this entity doesn't take damage from fire.
   */
  FireImmune = 'minecraft:fire_immune',
  /**
   * @remarks
   *   When added, this component signifies that this entity can float in liquid blocks.
   */
  FloatsInLiquid = 'minecraft:floats_in_liquid',
  /**
   * @remarks
   *   Represents the flying speed of an entity.
   */
  FlyingSpeed = 'minecraft:flying_speed',
  /**
   * @remarks
   *   Defines how much friction affects this entity.
   */
  FrictionModifier = 'minecraft:friction_modifier',
  /**
   * @remarks
   *   Sets the offset from the ground that the entity is actually at.
   */
  GroundOffset = 'minecraft:ground_offset',
  /**
   * @remarks
   *   Defines the interactions with this entity for healing it.
   */
  Healable = 'minecraft:healable',
  /**
   * @remarks
   *   Defines the health properties of an entity.
   */
  Health = 'minecraft:health',
  /**
   * @remarks
   *   Defines this entity's inventory properties.
   */
  Inventory = 'minecraft:inventory',
  /**
   * @remarks
   *   When added, this component signifies that this entity is a baby.
   */
  IsBaby = 'minecraft:is_baby',
  /**
   * @remarks
   *   When added, this component signifies that this entity is charged.
   */
  IsCharged = 'minecraft:is_charged',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently carrying a chest.
   */
  IsChested = 'minecraft:is_chested',
  /**
   * @remarks
   *   When added, this component signifies that dyes can be used on this entity to change its color.
   */
  IsDyeable = 'minecraft:is_dyeable',
  /**
   * @remarks
   *   When added, this component signifies that this entity can hide from hostile mobs while invisible.
   */
  IsHiddenWhenInvisible = 'minecraft:is_hidden_when_invisible',
  /**
   * @remarks
   *   When added, this component signifies that this entity this currently on fire.
   */
  IsIgnited = 'minecraft:is_ignited',
  /**
   * @remarks
   *   When added, this component signifies that this entity is an illager captain.
   */
  IsIllagerCaptain = 'minecraft:is_illager_captain',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently saddled.
   */
  IsSaddled = 'minecraft:is_saddled',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently shaking.
   */
  IsShaking = 'minecraft:is_shaking',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently sheared.
   */
  IsSheared = 'minecraft:is_sheared',
  /**
   * @remarks
   *   When added, this component signifies that this entity can be stacked.
   */
  IsStackable = 'minecraft:is_stackable',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently stunned.
   */
  IsStunned = 'minecraft:is_stunned',
  /**
   * @remarks
   *   When added, this component signifies that this entity is currently tamed.
   */
  IsTamed = 'minecraft:is_tamed',
  /**
   * @remarks
   *   If added onto the entity, this indicates that the entity represents a free-floating item in the world. Lets you
   *   retrieve the actual item stack contents via the itemStack property.
   */
  Item = 'minecraft:item',
  /**
   * @remarks
   *   Defines the base movement speed in lava of this entity.
   */
  LavaMovement = 'minecraft:lava_movement',
  /**
   * @remarks
   *   Allows this entity to be leashed and defines the conditions and events for this entity when is leashed.
   */
  Leashable = 'minecraft:leashable',
  /**
   * @remarks
   *   When added, this component signifies that this entity contains an additional variant value. Can be used to further
   *   differentiate variants.
   */
  MarkVariant = 'minecraft:mark_variant',
  /**
   * @remarks
   *   Defines the general movement speed of this entity.
   */
  Movement = 'minecraft:movement',
  /**
   * @remarks
   *   When added, this movement control allows the mob to swim in water and walk on land.
   */
  MovementAmphibious = 'minecraft:movement.amphibious',
  /**
   * @remarks
   *   When added, this component allows the movement of an entity.
   */
  MovementBasic = 'minecraft:movement.basic',
  /**
   * @remarks
   *   When added, this move control causes the mob to fly.
   */
  MovementFly = 'minecraft:movement.fly',
  /**
   * @remarks
   *   When added, this move control allows a mob to fly, swim, climb, etc.
   */
  MovementGeneric = 'minecraft:movement.generic',
  /**
   * @remarks
   *   When added, this movement control allows the mob to glide.
   */
  MovementGlide = 'minecraft:movement.glide',
  /**
   * @remarks
   *   When added, this move control causes the mob to hover.
   */
  MovementHover = 'minecraft:movement.hover',
  /**
   * @remarks
   *   Move control that causes the mob to jump as it moves with a specified delay between jumps.
   */
  MovementJump = 'minecraft:movement.jump',
  /**
   * @remarks
   *   When added, this move control causes the mob to hop as it moves.
   */
  MovementSkip = 'minecraft:movement.skip',
  /**
   * @remarks
   *   When added, this move control causes the mob to sway side to side giving the impression it is swimming.
   */
  MovementSway = 'minecraft:movement.sway',
  /**
   * @remarks
   *   Allows this entity to generate paths that include vertical walls (for example, like Minecraft spiders do.)
   */
  NavigationClimb = 'minecraft:navigation.climb',
  /**
   * @remarks
   *   Allows this entity to generate paths by flying around the air like the regular Ghast.
   */
  NavigationFloat = 'minecraft:navigation.float',
  /**
   * @remarks
   *   Allows this entity to generate paths in the air (for example, like Minecraft parrots do.)
   */
  NavigationFly = 'minecraft:navigation.fly',
  /**
   * @remarks
   *   Allows this entity to generate paths by walking, swimming, flying and/or climbing around and jumping up and down a
   *   block.
   */
  NavigationGeneric = 'minecraft:navigation.generic',
  /**
   * @remarks
   *   Allows this entity to generate paths in the air (for example, like the Minecraft Bees do.) Keeps them from falling
   *   out of the skies and doing predictive movement.
   */
  NavigationHover = 'minecraft:navigation.hover',
  /**
   * @remarks
   *   Allows this entity to generate paths by walking around and jumping up and down a block like regular mobs.
   */
  NavigationWalk = 'minecraft:navigation.walk',
  /**
   * @remarks
   *   Adds NPC capabilities to an entity such as custom skin, name, and dialogue interactions.
   * @beta
   */
  Npc = 'minecraft:npc',
  /**
   * @remarks
   *   When present on an entity, this entity is on fire.
   */
  OnFire = 'minecraft:onfire',
  /**
   * @remarks
   *   The projectile component controls the properties of a projectile entity and allows it to be shot in a given
   *   direction. This component is present when the entity has the minecraft:projectile component.
   */
  Projectile = 'minecraft:projectile',
  /**
   * @remarks
   *   Sets the distance through which the entity can push through.
   */
  PushThrough = 'minecraft:push_through',
  /**
   * @remarks
   *   When added, this component adds the capability that an entity can be ridden by another entity.
   */
  Rideable = 'minecraft:rideable',
  /**
   * @remarks
   *   This component is added to any entity when it is riding another entity.
   */
  Riding = 'minecraft:riding',
  /**
   * @remarks
   *   Sets the entity's visual size.
   */
  Scale = 'minecraft:scale',
  /**
   * @remarks
   *   Skin Id value. Can be used to differentiate skins, such as base skins for villagers.
   */
  SkinId = 'minecraft:skin_id',
  /**
   * @remarks
   *   Defines the entity's strength to carry items.
   */
  Strength = 'minecraft:strength',
  /**
   * @remarks
   *   Defines the rules for an entity to be tamed by the player.
   */
  Tameable = 'minecraft:tameable',
  /**
   * @remarks
   *   Contains options for taming a rideable entity based on the entity that mounts it.
   */
  TameMount = 'minecraft:tamemount',
  /**
   * @remarks
   *   Used to determine the type families the entity belongs to.
   */
  TypeFamily = 'minecraft:type_family',
  /**
   * @remarks
   *   Defines the general movement speed underwater of this entity.
   */
  UnderwaterMovement = 'minecraft:underwater_movement',
  /**
   * @remarks
   *   Used to differentiate the component group of a variant of an entity from others. (e.g. ocelot, villager).
   */
  Variant = 'minecraft:variant',
  /**
   * @remarks
   *   When added, this component signifies that this entity wants to become a jockey.
   */
  WantsJockey = 'minecraft:wants_jockey',
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

  get isValid() {
    return true
  }
}

export class Block {}

let players = 0

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

  id = `test player id ${players++}`
  name = 'Test player name'
  nameTag = this.name
  playSound = vi.fn()

  private gamemode: GameMode = GameMode.Survival
  getGameMode() {
    return this.gamemode
  }
  setGameMode(gameMode: GameMode) {
    this.gamemode = gameMode
  }
  getRotation() {
    return { x: 0, y: 0 }
  }

  level = 0

  addLevels(levels: number) {
    this.level += levels
  }

  sendMessage = vi.fn()

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

  clearRun(h: number) {}

  beforeEvents = new SystemBeforeEvents()

  afterEvents = new SystemAfterEvents()
}

export enum WatchdogTerminateReason {
  Hang = 'Hang',
  StackOverflow = 'StackOverflow',
}

export class SystemBeforeEvents {
  readonly watchdogTerminate = new EventSignal<{ cancel: boolean; terminateReason: WatchdogTerminateReason }>()
}

export class SystemAfterEvents {
  readonly scriptEventReceive = new EventSignal<unknown>()
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

export class MolangVariableMap {
  setColorRGBA = vi.fn()
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
  isValid = true

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
  Adventure = 'Adventure',
  Creative = 'Creative',
  Spectator = 'Spectator',
  Survival = 'Survival',
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

  isValid = true

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

/** Enum describing a structure's placement rotation. */
export enum StructureRotation {
  /**
   * @remarks
   *   No rotation.
   */
  None = 'None',
  /**
   * @remarks
   *   180 degree rotation.
   */
  Rotate180 = 'Rotate180',
  /**
   * @remarks
   *   270 degree rotation.
   */
  Rotate270 = 'Rotate270',
  /**
   * @remarks
   *   90 degree rotation.
   */
  Rotate90 = 'Rotate90',
}

// @ts-ignore Class inheritance allowed for native defined classes
export class CommandError extends Error {}

// @ts-ignore Class inheritance allowed for native defined classes
export class EnchantmentLevelOutOfBoundsError extends Error {}

// @ts-ignore Class inheritance allowed for native defined classes
export class EnchantmentTypeNotCompatibleError extends Error {}

// @ts-ignore Class inheritance allowed for native defined classes
export class EnchantmentTypeUnknownIdError extends Error {}

// @ts-ignore Class inheritance allowed for native defined classes
export class InvalidContainerSlotError extends Error {}

/** Thrown when a Structure is invalid. A structure becomes invalid when it is deleted. */
// @ts-ignore Class inheritance allowed for native defined classes
export class InvalidStructureError extends Error {}

/**
 * @beta
 * Thrown when trying to register an item custom component with
 * a name that has already been registered.
 */
// @ts-ignore Class inheritance allowed for native defined classes
export class ItemCustomComponentAlreadyRegisteredError extends Error {}

/**
 * @beta
 * Thrown when trying to register an item custom component with
 * an invalid namespace.
 */
// @ts-ignore Class inheritance allowed for native defined classes
export class ItemCustomComponentNameError extends Error {}

/**
 * @beta
 * Thrown after using the /reload command when trying to
 * register a previously unregistered item custom component.
 */
// @ts-ignore Class inheritance allowed for native defined classes
export class ItemCustomComponentReloadNewComponentError extends Error {}

/**
 * @beta
 * Thrown after using the /reload command when trying to
 * register a previously registered item custom component that
 * handles a new event.
 */
// @ts-ignore Class inheritance allowed for native defined classes
export class ItemCustomComponentReloadNewEventError extends Error {}

/**
 * @beta
 * Thrown after using the /reload command when trying to
 * register a previously registered item custom component with
 * a newer API version.
 */
// @ts-ignore Class inheritance allowed for native defined classes
export class ItemCustomComponentReloadVersionError extends Error {}

/** Thrown when the chunk for provided location or bounding area is not loaded. */
// @ts-ignore Class inheritance allowed for native defined classes
export class LocationInUnloadedChunkError extends Error {}

/** Thrown when a provided location or bounding area is outside the minimum or maximum dimension height. */
// @ts-ignore Class inheritance allowed for native defined classes
export class LocationOutOfWorldBoundariesError extends Error {}

/** @beta */
// @ts-ignore Class inheritance allowed for native defined classes
export class UnloadedChunksError extends Error {}

export const HudElementsCount = 13
export const HudVisibilityCount = 2
/**
 * @remarks
 *   Holds the number of MoonPhases
 */
export const MoonPhaseCount = 8
/** @beta */
export const TicksPerDay = 24000
/**
 * @remarks
 *   How many times the server ticks per second of real time.
 */
export const TicksPerSecond = 20
