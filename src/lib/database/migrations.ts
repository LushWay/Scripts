import { system } from '@minecraft/server'
import { table } from './abstract'

const database = table<boolean>('databaseMigrations')

export function migration(name: string, migrateFN: VoidFunction) {
  if (!database[name]) {
    system.delay(() => {
      if (database[name]) return
      migrateFN()
      database[name] = true
    })
  }
}
