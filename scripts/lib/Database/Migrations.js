import { system } from '@minecraft/server'
import { DynamicPropertyDB } from 'lib/Database/Properties.js'

/**
 * @param {string} name
 * @param {VoidFunction} migrateFN
 */
export function migration(name, migrateFN) {
  if (!migration.database[name]) {
    system.delay(() => {
      migrateFN()
      migration.database[name] = true
    })
  }
}

/** @type {Record<string, boolean | undefined>} */
migration.database = new DynamicPropertyDB('databaseMigrations').proxy()
