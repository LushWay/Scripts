import { system, world } from '@minecraft/server'
import { table } from './abstract'

const database = table<boolean>('databaseMigrations')

export function migration(name: string, migrateFN: VoidFunction) {
  world.afterEvents.worldLoad.subscribe(() => {
    if (database.has(name)) return

    system.delay(() => {
      if (database.get(name)) return
      migrateFN()
      database.set(name, true)
    })
  })
}
