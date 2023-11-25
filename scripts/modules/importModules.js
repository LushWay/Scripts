import { system } from '@minecraft/server'
import { util } from '../smapi.js'

const modules = [
  './DatabaseView/index.js',
  './Server/PlayerJoin/join.js',
  './Server/Indicator/index.js',
  './Server/chat.js',
  './Server/index.js',
  './Server/Catscene/index.js',

  './Gameplay/Build/camera.js',

  '../lib/Class/Quest.js',
  '../test/test.js',
  './WorldEdit/index.js',
]

const enabled = 0
const strike = util.strikeTest()

/**
 * @param {object} [o]
 * @param {string[]} [o.array]
 * @param {string} [o.strikeMessage]
 * @param {(m: string) => Promise<any>} [o.fn]
 * @param {number} [o.striketest]
 */
export default async function ({
  array = modules,
  strikeMessage = 'SM init and loading took',
  fn = module => import(module),
  striketest = enabled,
} = {}) {
  if (striketest) strike(strikeMessage)

  let stop = false
  for (const module of array) {
    system.run(async () => {
      if (stop) return
      try {
        await fn(module)
      } catch (e) {
        util.error(e, {
          errorName: 'ModuleLoad',
          additionalStack: [module],
          deleteStack: 1,
        })
        stop = true
      }

      if (striketest) strike(module)
    })
  }
}
