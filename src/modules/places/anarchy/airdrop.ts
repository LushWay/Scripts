import { system, TicksPerSecond, world } from '@minecraft/server'
import { Airdrop, Loot, ms, Vector } from 'lib'
import { t } from 'lib/text'
import { Anarchy } from 'modules/places/anarchy/anarchy'
import { CannonBulletItem, CannonItem } from '../../features/cannon'
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

  .itemStack(CannonBulletItem.blueprint)
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

  .itemStack(CannonBulletItem.itemStack)
  .chance('10%')

  .itemStack(CannonItem.itemStack)
  .chance('5%').build

function timeout() {
  system.runTimeout(
    async () => {
      if (!Anarchy.zone || Anarchy.zone.lastRadius < 100) return

      const online = world.getAllPlayers().length
      if (online < 1) return

      const isPowerfull = online > 3

      const result = await randomLocationInAnarchy()
      if (result) {
        world.say(
          t.raw`§l§a>§r§7 ${isPowerfull ? 'Усиленный' : 'Обычный'} аирдроп появился на ${Vector.string(result.topmost)}!`,
        )
        new Airdrop({ loot: isPowerfull ? powerfull : base }).spawn(result.air)
      }

      timeout()
    },
    'airdrop',
    ms.from('min', 3) / TicksPerSecond,
  )
}

timeout()
