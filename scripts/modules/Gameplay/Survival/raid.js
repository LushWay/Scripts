import { Player, system, world } from '@minecraft/server'
import { LockAction, ScoreboardDB } from 'xapi.js'
import { Region } from '../../Server/Region/Region.js'
import { RaidNotify } from './var.js'

world.beforeEvents.explosion.subscribe(data => {
  for (const bl of data.getImpactedBlocks()) {
    const region = Region.locationInRegion(bl, data.dimension.type)
    if (!region) return
    if (!region.permissions?.pvp) return (data.cancel = true)
    for (const id of region.permissions.owners) RaidNotify[id] = 60
  }
})

const RAID = new ScoreboardDB('raid', 'Raid')
new LockAction(
  player => RAID.get(player) > 0,
  'Вы находитесь в режиме рейдблока.'
)

system.runInterval(
  () => {
    for (const id in RaidNotify) {
      // Ищем игрока...
      const player = Player.fetch(id)
      if (player) {
        if (RAID.get(player) === 0) {
          player.tell(
            '§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.'
          )
          player.playSound('mob.wolf.bark')
        }
        RAID.set(player, RaidNotify[id])
        delete RaidNotify[id]
        continue
      }

      RaidNotify[id]--
      if (RaidNotify[id] <= 0) {
        // Время вышло, игрока не было
        delete RaidNotify[id]
        continue
      }
    }
  },
  'raid notify',
  20
)
