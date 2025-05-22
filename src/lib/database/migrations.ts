import { system } from '@minecraft/server'
import { table } from './abstract'

const database = table<boolean>('databaseMigrations')

export function migration(name: string, migrateFN: VoidFunction) {
  if (!database.get(name)) {
    system.delay(() => {
      if (database.get(name)) return
      migrateFN()
      database.set(name, true)
    })
  }
}
