import { LocationInUnloadedChunkError, system, world } from '@minecraft/server'
import { Airdrop, Loot, Vector } from 'lib'
import { t } from 'lib/text'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { CannonItem, CannonShellItem } from '../../features/cannon'
import { randomLocationInAnarchy } from './random-location-in-anarchy'

const base = new Loot('base_airdrop')
  .item('Gunpowder')
  .amount({
    '1...10': '40%',
    '11...20': '2%',
  })
  .chance('20%')

  .item('CookedBeef')
  .amount({
    '30...64': '40%',
    '65...128': '2%',
  })
  .chance('20%')

  .itemStack(CannonShellItem.blueprint)
  .chance('10%')

  .itemStack(CannonItem.blueprint)
  .chance('5%').build

const powerfull = new Loot('powerfull_airdrop')
  .item('Gunpowder')
  .amount({
    '30...64': '40%',
    '65...100': '2%',
  })
  .chance('20%')

  .item('CookedBeef')
  .amount({
    '30...64': '40%',
    '65...128': '2%',
  })
  .chance('20%')

  .itemStack(CannonShellItem.itemStack)
  .chance('10%')

  .itemStack(CannonItem.itemStack)
  .chance('5%').build

let airdrop: Airdrop | undefined
function timeout() {
  system.runTimeout(
    async () => {
      if (!Anarchy.zone) return timeout()

      const online = world.getAllPlayers().length
      if (online < 1) return timeout()

      if (airdrop) airdrop.delete()
      const isPowerfull = online > 3
      airdrop = await requestAirdrop(isPowerfull)

      timeout()
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
      const airdrop = new Airdrop({ loot: isPowerfull ? powerfull : base }).spawn(result.air).createMarkerOnMinimap()
      world.say(
        t.raw`§l§a>§r§7 ${isPowerfull ? 'Усиленный' : 'Обычный'} аирдроп появился на ${Vector.string(result.topmost, true)}!`,
      )
      return airdrop
    } catch (e) {
      if (e instanceof LocationInUnloadedChunkError) {
        console.warn('Unable to spawn 15m airdrop: location unloaded')
      }
    }
  }
}
