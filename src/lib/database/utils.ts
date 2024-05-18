import { BlockVolume, Entity, StructureSaveMode, system, world } from '@minecraft/server'
import { Vector } from 'lib/vector'

interface TableEntity {
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

  private static readonly tablesDimension = world.overworld

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

      world.structureManager.place(this.backupName, this.tablesDimension, this.entityLocation)
      this.allEntities = this.getEntities()

      if (this.allEntities.length < 1) {
        console.warn('§cНе удалось загрузить базы данных из бэкапа.')
        return []
      } else console.warn('Бэкап успешно загружен! Всего баз данных: ' + this.allEntities.length)
    }

    return this.allEntities
  }

  /** Creates a table entity that is used for data storage */
  static createTableEntity(tableType: string, tableName: string, index = 0): Entity {
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
      console.error(e)
    }
  }

  static backupName = 'mystructure:database'

  private static waitingForBackup = false

  static backup() {
    if (this.waitingForBackup) return

    system.runTimeout(
      () => {
        this.waitingForBackup = false
        world.structureManager.delete(this.backupName)
        world.structureManager.createFromWorld(
          this.backupName,
          this.tablesDimension,
          new BlockVolume(this.entityLocation, this.entityLocation),
          { includeBlocks: false, includeEntities: true, saveMode: StructureSaveMode.World },
        )
      },
      'database backup',
      200,
    )
    this.waitingForBackup = true
  }
}

if (!__TEST__) {
  world.afterEvents.worldInitialize.subscribe(() => {
    world.overworld.runCommandAsync('tickingarea add 0 -64 0 0 200 0 database true')
  })
}
