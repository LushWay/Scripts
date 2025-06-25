import { system } from '@minecraft/server'
import { dedupe } from 'lib/dedupe'
import { i18n } from 'lib/i18n/text'
import { getRandomXZInCircle, getTopmostSolidBlock } from 'lib/utils/game'
import { Anarchy } from 'modules/places/anarchy/anarchy'

/**
 * Tries to find random location in anarhcy zone radius which is not in the ocean. Used for Airdrops and RTP.
 *
 * This function can be called only once concurrently. For example, if it was earlier called in the other part of script
 * and you call it here, it will wait for previous function to finish loading chunk and only then will execute. That is
 * for preventing overload
 */
export const randomLocationInAnarchy = dedupe(async function randomLocationInAnarchy({
  info,
  onBlock,
}: {
  info?: (info: Text) => void
  onBlock?: (block: Vector3) => void
} = {}) {
  if (!Anarchy.zone) return
  info?.(i18n`Поиск случайной локации без воды...`)

  return new Promise<false | { air: Vector3; topmost: Vector3 }>(resolve => {
    const maxTries = 100
    let i = maxTries
    timeout()
    function timeout() {
      system.runTimeout(
        async () => {
          i--
          if (i < 0) return resolve(false)
          if (!Anarchy.zone) return

          const random = getRandomXZInCircle(1000)
          const position = { x: random.x + Anarchy.zone.center.x, y: 200, z: random.z + Anarchy.zone.center.z }
          onBlock?.(position)
          const topmostBlock = await getTopmostSolidBlock(position)

          if (topmostBlock) {
            info?.(i18n`Найдено!`)
            return resolve({ air: position, topmost: topmostBlock })
          } else {
            info?.(i18n`Вода. Попытка ${maxTries - i}/${maxTries}`)
            timeout()
          }
        },
        'randomLocationInAnarchy',
        5,
      )
    }
  })
})
