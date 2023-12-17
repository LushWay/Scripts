import { system } from '@minecraft/server'
import { util } from '../smapi.js'

const modules = [
  './PlayerJoin/playerJoin.js',
  './Indicator/index.js',
  './Server/chat.js',
  './Server/index.js',
  './Build/camera.js',
  './WorldEdit/index.js',
  './Commands/index.js',
  '../test/test.js',
]

const enabled = 0
const strike = util.strikeTest()

/**
 * @param {object} [o]
 * @param {string[]} [o.array]
 * @param {string} [o.strikeMessage]
 * @param {(m: string) => Promise<any>} [o.fn]
 * @param {number} [o.striketest]
 * @param {number} [o.deleteStack]
 */
export default async function ({
  array = modules,
  strikeMessage = 'SM init and loading took',
  fn = module => import(module),
  striketest = enabled,
  deleteStack = 1,
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
          deleteStack,
        })
        stop = true
      }

      if (striketest) strike(module)
      await nextTick
    })
  }
}
