import { system } from '@minecraft/server'
import { onLoad } from 'lib/utils/load-ref'
import { table } from './abstract'

const database = table<boolean>('databaseMigrations')

export function migration(name: string, migrateFN: VoidFunction) {
  onLoad(() => {
    if (database.has(name)) return

    system.delay(() => {
      if (database.get(name)) return
      migrateFN()
      database.set(name, true)
    })
  })
}
