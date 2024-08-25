import { system } from '@minecraft/server'
import { dedupe } from 'lib/dedupe'
import { getRandomVectorInCircle, getTopmostSolidBlock } from 'lib/game-utils'
import { Anarchy } from 'modules/places/anarchy/anarchy'

/**
 * Tries to find random location in anarhcy zone radius which is not in the ocean. Used for Airdrops and RTP.
 *
 * This function can be called only once concurrently. For example, if it was earlier called in the other part of script
 * and you call it here, it will wait for previous function to finish loading chunk and only then will execute. That is
 * for preventing overload
 */
export const randomLocationInAnarchy = dedupe(async function randomLocationInAnarchy() {
  if (!Anarchy.zone) return
  console.debug('Searching for random location in anarchy without water...')

  return new Promise<false | { air: Vector3; topmost: Vector3 }>(resolve => {
    let i = 100
    timeout()
    function timeout() {
      system.runTimeout(
        async () => {
          i--
          if (i < 0) return resolve(false)
          if (!Anarchy.zone) return

          const random = getRandomVectorInCircle(1000) //Anarchy.zone.lastRadius / 2
          const position = { x: random.x + Anarchy.zone.center.x, y: 200, z: random.z + Anarchy.zone.center.z }

          const topmostBlock = await getTopmostSolidBlock(position)
          if (topmostBlock) {
            console.debug('Found!')
            return resolve({ air: position, topmost: topmostBlock })
          } else {
            console.debug('Water. Try', 100 - i, 'biome')
            timeout()
          }
        },
        'randomLocationInAnarchy',
        5,
      )
    }
  })
})
