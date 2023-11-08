import { util } from '../xapi.js'

const modules = [
  './Server/Admin/index.js',
  './Server/Chat/index.js',
  // "./Server/DatabaseView/index.js",
  './Server/HelpCommand/index.js',
  // "./Server/Menu/index.js",
  // "./Server/OnJoin/join.js",
  // "./Server/Server/index.js",
  // "./Server/Leaderboards/index.js",
  // "./Server/Objectives/index.js",

  /**
   * Gameplay modules
   */
  // "./Gameplay/Loot/loot.js",
  // "./Gameplay/Build/camera.js",

  /**
   * Development modules:
   */
  // "../lib/Class/Quest.js",
  // "./Development/GameTest/index.js",
  './Development/Test/index.js',
  './Development/WorldEdit/index.js',
]

const enabled = 0
const strike = util.strikeTest()

/**
 * @param {Object} [o]
 * @param {string[]} [o.array]
 * @param {string} [o.message]
 * @param {(m: string) => Promise<any>} [o.fn]
 * @param {number} [o.striketest]
 */
export default async function ({
  array = modules,
  message = 'SM init and loading took',
  fn = module => import(module),
  striketest = enabled,
} = {}) {
  if (striketest) strike(message)

  for (const module of array) {
    await nextTick
    await fn(module)
    if (striketest) strike(module)
  }
}
