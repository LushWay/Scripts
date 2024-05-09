import { Entity, Vector, system, world } from '@minecraft/server'
import { util } from '../util'

type TableEntity = {
  entity: Entity
  tableName: string
  tableType: string
  index: number
}

export class DatabaseUtils {
  /** TypeId of the database table entity */
  static entityTypeId = 'rubedo:database'

  /** Location of the database table entities */
  static entityLocation = { x: 0, y: -64, z: 0 }

  /** Inventory size of the database table entity */
  static inventorySize = 96

  static chunkRegexp = /.{1,50}/g

  static propertyChunkRegexp = /.{1,32767}/g

  private static allEntities: TableEntity[]

  private static getEntities() {
    return world.overworld
      .getEntities({ type: DatabaseUtils.entityTypeId })
      .map(entity => {
        const tableType = entity.getDynamicProperty('tableType')
        const tableName = entity.getDynamicProperty('tableName')
        const index = entity.getDynamicProperty('index')

        if (typeof tableName !== 'string' || typeof tableType !== 'string' || typeof index !== 'number')
          return { entity, tableName: 'NOTDB', tableType: 'NONE', index: 0 }

        if (Vector.distance(entity.location, DatabaseUtils.entityLocation) > 1) {
          entity.teleport(DatabaseUtils.entityLocation)
        }

        return {
          entity,
          tableName,
          tableType,
          index,
        }
      })
      .filter(e => e.tableName !== 'NOTDB')
  }

  private static tables(): TableEntity[] {
    if (this.allEntities) return this.allEntities
    this.allEntities = this.getEntities()

    if (this.allEntities.length < 1) {
      console.warn('§6Не удалось найти базы данных. Попытка загрузить бэкап...')

      world.overworld
        .getEntities({
          location: DatabaseUtils.entityLocation,
          type: DatabaseUtils.entityTypeId,
          maxDistance: 2,
        })
        .forEach(e => e.remove())

      world.overworld.runCommand(
        `structure load ${DatabaseUtils.backupName} ${Vector.string(DatabaseUtils.entityLocation)}`,
      )
      this.allEntities = this.getEntities()

      if (this.allEntities.length < 1) {
        console.warn('§cНе удалось загрузить базы данных из бэкапа.')
        return []
      } else console.warn('Бэкап успешно загружен! Всего баз данных: ' + this.allEntities.length)
    }

    return this.allEntities
  }

  /** Creates a table entity that is used for data storage */
  static createTableEntity(tableType: string, tableName: string, index: number = 0): Entity {
    const entity = world.overworld.spawnEntity(DatabaseUtils.entityTypeId, DatabaseUtils.entityLocation)

    entity.setDynamicProperty('tableName', tableName)
    entity.setDynamicProperty('tableType', tableType)
    entity.setDynamicProperty('index', index)
    entity.nameTag = `§7DB §f${tableName} `

    return entity
  }

  /** A function that returns an array of entities that have the same tableType and tableName. */
  static getTableEntities(tableType: string, tableName: string) {
    try {
      return this.tables()
        .filter(e => e.tableType === tableType && e.tableName === tableName)
        .sort((a, b) => a.index - b.index)
        .map(e => e.entity)
    } catch (e) {
      util.error(e)
    }
  }

  static backupName = 'database'

  static backupLocation = Vector.string(this.entityLocation)

  static backupCommand = `structure save ${this.backupName} ${this.backupLocation} ${this.backupLocation} true disk false`

  private static waitingForBackup = false

  static backup() {
    if (this.waitingForBackup) return

    system.runTimeout(
      () => {
        this.waitingForBackup = false
        world.overworld.runCommand(this.backupCommand)
      },
      'database backup',
      200,
    )
    this.waitingForBackup = true
  }

  static setDefaults<O extends JSONLike, D extends JSONLike>(sourceObject: O, defaultObject: D): O & D {
    if (Array.isArray(sourceObject)) {
      return sourceObject
    } else if (Array.isArray(defaultObject)) return defaultObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: JSONLike = {}

    // Copy properties from the defaults object
    for (const key in defaultObject) {
      const value = sourceObject[key]
      const defaultValue = defaultObject[key]

      if (typeof defaultValue === 'object' && defaultValue !== null) {
        // Value is Object or array, recurse...

        if (Array.isArray(defaultValue)) {
          if (typeof value !== 'undefined' && Array.isArray(value)) {
            COMPOSED[key] = [...value]
          } else {
            COMPOSED[key] = [...defaultValue]
          }
        } else {
          if (key in sourceObject) {
            COMPOSED[key] = this.setDefaults(value, defaultValue)
          } else {
            // If the original object doesn't have the property, add default value
            // And unlink properties...

            COMPOSED[key] = this.setDefaults({}, defaultValue)
          }
        }
      } else {
        // Primitive value, assign
        COMPOSED[key] = typeof value === 'undefined' ? defaultValue : value
      }
    }

    // Copy properties from the original object
    for (const key in sourceObject) {
      // If the property is not in the result object, copy it from the original object
      if (!(key in COMPOSED)) {
        COMPOSED[key] = sourceObject[key]
      }
    }

    return COMPOSED
  }

  static removeDefaults<S extends JSONLike>(sourceObject: S, defaultObject: JSONLike): S {
    if (Array.isArray(sourceObject)) return sourceObject

    // Create a new object to avoid modifying the original object
    const COMPOSED: JSONLike = {}

    for (const key in sourceObject) {
      const value = sourceObject[key]
      const defaultValue = defaultObject[key]

      if (value === defaultValue) continue

      if (typeof defaultValue === 'object' && defaultValue !== null && typeof value === 'object' && value !== null) {
        if (Array.isArray(defaultValue)) {
          //
          if (Array.isArray(value) || Array.equals(value, defaultValue)) continue

          COMPOSED[key] = value
        } else {
          //
          const composedSubObject = this.removeDefaults(value, defaultValue)
          if (Object.keys(composedSubObject).length < 1) continue

          COMPOSED[key] = composedSubObject
        }
      } else {
        // Primitive value, assign

        COMPOSED[key] = value
      }
    }

    return COMPOSED
  }

  protected constructor() {}
}

export class DatabaseError extends Error {}

world.afterEvents.worldInitialize.subscribe(() => {
  world.overworld.runCommandAsync('tickingarea add 0 -64 0 0 200 0 database true')
})
