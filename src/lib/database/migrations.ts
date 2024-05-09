import { system } from '@minecraft/server'
import { table } from './abstract'

export function migration(name: string, migrateFN: VoidFunction) {
  if (!migration.database[name]) {
    system.delay(() => {
      migrateFN()
      migration.database[name] = true
    })
  }
}

export namespace migration {
  export const database = table<boolean>('databaseMigrations')
}
