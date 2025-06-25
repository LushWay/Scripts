import { Entity, EquipmentSlot, ItemStack, Player, system } from '@minecraft/server'

import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Core } from 'lib/extensions/core'
import { noI18n } from 'lib/i18n/text'
import stringifyError from 'lib/utils/error'
import { DatabaseError } from './abstract'
import { DatabaseUtils } from './utils'

const tableType = 'inventory'

type Equipment = Exclude<keyof typeof EquipmentSlot, 'mainhand'>

export interface Inventory {
  slots: Record<string, ItemStack>
  equipment: Partial<Record<Equipment, ItemStack>>
  xp: number
  health: number
}

interface StoreManifest {
  owner: string
  slots: (number | Equipment)[]
  xp: number
  health: number
}

export class InventoryStore {
  static emptyInventory: Inventory = {
    health: 20,
    xp: 0,
    slots: {},
    equipment: {},
  }

  /**
   * Loads equipment and inventory items from inventory object to an player.
   *
   * @param o - Load options
   * @param o.to - The entity that is receiving the equipment and inventory items being loaded.
   * @param o.from - The object from which the equipment and inventory items are being loaded.
   * @param o.clearAll - Boolean that determines clear entity inventory before loading or not
   */
  static load({ to, from, clearAll = true }: { to: Player; from: Inventory; clearAll?: boolean }) {
    const equipment = to.getComponent('equippable')
    if (!equipment) return
    equipment.setEquipment(EquipmentSlot.Offhand, from.equipment.Offhand)
    equipment.setEquipment(EquipmentSlot.Head, from.equipment.Head)
    equipment.setEquipment(EquipmentSlot.Chest, from.equipment.Chest)
    equipment.setEquipment(EquipmentSlot.Legs, from.equipment.Legs)
    equipment.setEquipment(EquipmentSlot.Feet, from.equipment.Feet)

    to.resetLevel()
    to.addExperience(from.xp)

    const health = to.getComponent('health')
    if (health) health.setCurrentValue(from.health)

    const { container } = to
    if (!container) return
    if (clearAll) container.clearAll()
    for (const [i, item] of Object.entries(from.slots)) {
      try {
        if (typeof item !== 'undefined') container.setItem(Number(i), item)
      } catch (e) {
        to.fail(noI18n`Failed to load item to slot ${i}.`)
        console.error(
          `§cFailed to load inventory slot §f${i}§c for player §f${to.name}§r§c, item: `,
          item,
          '§r§cerror:',
          e,
        )
      }
    }
  }

  /**
   * Returns an object containing the equipment and inventory slots of a player.
   *
   * @param {Player} from - The entity from which we are retrieving the equipment and inventory information. It is used
   *   to access the "equippable" and "inventory" components of the entity.
   */
  static get(from: Player): Inventory {
    const equipment = from.getComponent('equippable')
    if (!equipment) throw new ReferenceError('Equippable component does not exists')

    const { container } = from
    if (!container) throw new ReferenceError('Container does not exists')

    const xp = from.getTotalXp()

    const healthComponent = from.getComponent('health')
    if (!healthComponent) throw new ReferenceError('Health component does not exists')

    const health = healthComponent.currentValue

    /** @type {Inventory['slots']} */
    const slots: Inventory['slots'] = {}

    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i)
      if (!item) continue

      slots[i] = item
    }

    return {
      xp,
      health,
      slots,
      equipment: {
        Offhand: equipment.getEquipment(EquipmentSlot.Offhand),
        Head: equipment.getEquipment(EquipmentSlot.Head),
        Chest: equipment.getEquipment(EquipmentSlot.Chest),
        Legs: equipment.getEquipment(EquipmentSlot.Legs),
        Feet: equipment.getEquipment(EquipmentSlot.Feet),
      },
    }
  }

  /** List of all loaded table entities */
  private entities: Entity[] = []

  private tableType = tableType

  /** List of all loaded inventories */
  private inventories = new Map<string, Inventory>()

  /**
   * Creates new inventory store manager
   *
   * @param tableName - Unique id of the table
   */
  constructor(public tableName: string) {
    // Init database only when entities are loaded
    Core.afterEvents.worldLoad.subscribe(() => this.init())
  }

  private init() {
    const entities = DatabaseUtils.getTableEntities(this.tableType, this.tableName)
    if (!entities) throw new DatabaseError('Failed to get inventory entities in table ' + this.tableName)
    this.entities = entities

    const items: ItemStack[] = []

    for (const entity of this.entities) {
      const { container } = entity
      if (!container) return

      for (const [, item] of container.entries()) {
        if (!item) break
        items.push(item)
      }
    }

    let store: Inventory = {
      xp: 0,
      health: 20,
      equipment: {},
      slots: {},
    }
    let slots: Record<number, { type: 'equipment' | 'slots'; index: Equipment | number }> = []
    let step = 0
    let owner = ''

    for (const item of items) {
      const raw = item.getLore().join('')

      // Finding manifest
      if (raw && raw.at(0) === '{' && raw.at(-1) === '}') {
        let manifest
        try {
          manifest = JSON.parse(raw) as StoreManifest
        } catch {}

        // No data means that this isnt manifest, do nothing
        if (!manifest) continue

        // Saving previosly parsed inventory if exists
        if (owner) {
          this.inventories.set(owner, store)
          store = {
            xp: 0,
            health: 20,
            equipment: {},
            slots: {},
          }
        }

        owner = manifest.owner
        step = 0
        store.health = manifest.health
        store.xp = manifest.xp
        slots = manifest.slots.map(e => ({
          type: typeof e === 'string' ? 'equipment' : 'slots',
          index: e,
        }))
        continue
      }

      if (typeof slots === 'undefined') {
        return console.error(new DatabaseError(`Failed to load InventoryStore(${this.tableName}): No manifest found!`))
      }

      const slot = slots[step]
      if (typeof slot !== 'undefined') {
        const { type, index } = slot
        // @ts-expect-error AAAAAAAAAAAAAAAA
        store[type][index] = item
      }

      step++
    }

    if (owner) {
      this.inventories.set(owner, store)
    }

    // console.log(
    //   [...this.inventories.entries()].map(([id, inventory]) => [
    //     Player.name(id) ?? id,
    //     {
    //       ...inventory,
    //       equipment: Object.fromEntries(
    //         Object.entries(inventory.equipment).map(([key, value]) => [key, value.typeId + ' ' + value.amount]),
    //       ),
    //       slots: Object.fromEntries(
    //         Object.entries(inventory.slots).map(([key, value]) => [key, value.typeId + ' ' + value.amount]),
    //       ),
    //     },
    //   ]),
    // )
  }

  private save() {
    const items: ItemStack[] = []

    for (const [owner, store] of this.inventories) {
      const storeIndex = items.length
      const manifest: StoreManifest = {
        health: store.health,
        xp: store.xp,
        owner,
        slots: [],
      }

      for (const key of Object.keys(store.equipment)) {
        if (!store.equipment[key]) continue
        const move = manifest.slots.push(key)
        const eq = store.equipment[key]
        if (typeof eq === 'undefined') throw new DatabaseError(noI18n.error`Failed to get equipment with key ${key}`)

        items[storeIndex + move] = eq
      }

      for (const [key, stack] of Object.entries(store.slots)) {
        if (typeof stack === 'undefined') continue

        const move = manifest.slots.push(Number(key))
        items[storeIndex + move] = stack
      }

      const item = new ItemStack(MinecraftItemTypes.AcaciaBoat)
      const save = JSON.stringify(manifest).match(DatabaseUtils.chunkRegexp)
      if (!save) throw new DatabaseError('Failed to split save to chunks')
      item.setLore(save)
      items[storeIndex] = item
    }

    const totalEntities = Math.ceil(items.length / DatabaseUtils.inventorySize)
    const entities = DatabaseUtils.getTableEntities(this.tableType, this.tableName)

    if (!entities) throw new DatabaseError('Failed to get entities')

    const entitiesToSpawn = totalEntities - entities.length

    if (entitiesToSpawn > 0) {
      for (let i = 0; i < entitiesToSpawn; i++) {
        entities.push(DatabaseUtils.createTableEntity(this.tableType, this.tableName, i))
      }
    } else if (entitiesToSpawn < 0) {
      // Check for unused entities and despawn them
      for (let i = totalEntities; i >= entities.length; i--) entities[i]?.remove()
    }

    let itemIndex = 0
    for (const [i, entity] of entities.entries()) {
      const { container } = entity
      if (!container) throw new ReferenceError('No container found on entity while saving inventory')
      container.clearAll()

      for (let i = 0; i < container.size; i++) {
        container.setItem(i, items[itemIndex])
        itemIndex++
      }
      entity.setDynamicProperty('index', i)
    }

    this.entities = entities

    DatabaseUtils.backup()
  }

  remove(id: string) {
    this.inventories.delete(id)
    this.requestSave()
  }

  private saving = false

  private requestSave() {
    if (this.saving) return
    const { stack } = new Error()

    system.runTimeout(
      () => {
        try {
          this.save()
          this.saving = false
        } catch (error) {
          console.error(
            'Unable to save InventoryStore, error:',
            error,
            '\nSaving request by:',
            stringifyError.stack.get(2, stack),
          )
        }
      },
      'inventorySave',
      20,
    )
    this.saving = true
  }

  /**
   * Gets entity store from saved and removes to avoid bugs
   *
   * @param {string} id - The ID of the entity whose store is being retrieved.
   * @param {object} [o]
   * @param {boolean} [o.remove] - A boolean parameter that determines whether the entity store should be removed from
   *   the internal stores object after it has been retrieved. If set to true, the store will be deleted from the
   *   object. If set to false, the store will remain in the object.
   * @param {Inventory} [o.fallback] - Inventory to return if there is no inventory in store
   * @returns The entity store associated with the given entity ID.
   */
  get(id: string, { remove = true, fallback }: { remove?: boolean; fallback?: Inventory } = {}) {
    const store = this.inventories.get(id)
    if (!store) {
      if (fallback) return fallback
      else throw new DatabaseError('Inventory not found')
    }

    if (remove) this.remove(id)
    return store
  }

  /**
   * Saves an player inventory to a store and requests a save.
   *
   * @param entity - The entity object that needs to be saved in the store.
   * @param options - Options
   * @param options.rewrite - A boolean parameter that determines whether or not to allow rewriting of an existing
   *   entity in the store. If set to false and the entity already exists in the store, a DatabaseError will be thrown.
   *   If set to true, the existing entity will be overwritten with the new entity.
   * @param options.keepInventory - A boolean that determines keep entity's invetory or not
   * @param options.key - Key to associate inventory with
   */
  saveFrom(
    entity: Player,
    {
      rewrite = false,
      keepInventory = false,
      key = entity.id,
    }: { rewrite?: boolean; keepInventory?: boolean; key?: string } = {},
  ) {
    if (key in this.inventories && !rewrite)
      throw new DatabaseError('Cannot rewrite entity store with disabled rewriting.')

    this.inventories.set(key, InventoryStore.get(entity))
    this.requestSave()

    if (!keepInventory) entity.container?.clearAll()
  }

  /**
   * Checks if key was saved into this store
   *
   * @param key - Entity ID to check
   */
  has(key: string) {
    return this.inventories.has(key)
  }
}
