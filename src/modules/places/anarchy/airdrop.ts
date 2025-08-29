import { LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { Airdrop, isNotPlaying, Loot, Vec } from 'lib'
import { Items } from 'lib/assets/custom-items'
import { i18n } from 'lib/i18n/text'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { CannonItem, CannonShellItem } from '../../pvp/cannon'
import { randomLocationInAnarchy } from './random-location-in-anarchy'

const base = new Loot('base_airdrop')
  .item('Gunpowder')
  .amount({ '1...10': '40%', '11...20': '2%' })
  .weight('20%')

  .item('CookedBeef')
  .amount({ '25...50': '40%', '51...90': '2%' })
  .weight('20%')

  .itemStack(CannonShellItem.blueprint)
  .weight('10%')

  .itemStack(CannonItem.blueprint)
  .weight('5%')

  .item(Items.Money)
  .weight('100%')
  .amount({ '10...40': '1%' })
  .duplicate(5).build

const powerfull = new Loot('powerfull_airdrop')
  .item('Gunpowder')
  .amount({ '30...64': '40%', '65...100': '2%' })
  .weight('20%')

  .item('CookedBeef')
  .amount({ '30...64': '40%', '65...128': '2%' })
  .weight('20%')

  .itemStack(CannonShellItem.itemStack)
  .weight('10%')

  .itemStack(CannonItem.itemStack)
  .weight('5%')

  .item(Items.Money)
  .weight('100%')
  .amount({ '10...40': '1%' })
  .duplicate(5).build

let airdrop: Airdrop | undefined
function timeout() {
  system.runTimeout(
    async () => {
      try {
        if (!Anarchy.zone) return

        const online = world.getAllPlayers().filter(e => !isNotPlaying(e)).length
        if (online < 1) return

        for (const [id, airdrop] of Airdrop.db.entriesImmutable()) {
          if (airdrop) {
            if (airdrop.type === '15m') {
              const instance = Airdrop.instances.find(e => e.id === id)
              if (instance) instance.delete()
              else Airdrop.db.delete(id)
            }
          }
        }
        if (airdrop) airdrop.delete()

        const isPowerfull = online > 3
        airdrop = await requestAirdrop(isPowerfull)
      } catch (e) {
        console.warn('Unable to request 15m airdrop:', e)
      } finally {
        timeout()
      }
    },
    'airdrop',
    // 15 min
    20 * 60 * 15,
  )
}

timeout()

export async function requestAirdrop(isPowerfull: boolean) {
  const result = await randomLocationInAnarchy()
  if (result) {
    try {
      const airdrop = new Airdrop({ loot: isPowerfull ? powerfull : base, type: '15m' })
        .spawn(result.air)
        .createMarkerOnMinimap()

      const location = Vec.string(result.topmost, true)

      for (const player of world.getAllPlayers()) {
        player.success(
          isPowerfull
            ? i18n`Усиленный аирдроп скоро упадет на ${location}!`
            : i18n`Обычный аирдроп скоро упадет на ${location}!`,
        )
      }
      return airdrop
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) {
        console.warn('Unable to spawn 15m airdrop: location unloaded')
      } else console.error(e)
    }
  }
}
