import { system } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

const MIGRATION_DB = new DynamicPropertyDB('db_migrations', {
  /** @type {Record<string, boolean | undefined>} */
  type: {},
}).proxy()

/**
 * @param {string} name
 * @param {VoidFunction} migrateFN
 */
export function migration(name, migrateFN) {
  if (!MIGRATION_DB[name]) {
    system.delay(() => {
      migrateFN()
      MIGRATION_DB[name] = true
    })
  }
}
