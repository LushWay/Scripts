import { Player, system, world } from '@minecraft/server'
import { LockAction, ScoreboardDB } from 'smapi.js'
import { Region } from '../../Region/Region.js'
import { RAID_NOTIFY } from './var.js'

world.beforeEvents.explosion.subscribe(data => {
  for (const bl of data.getImpactedBlocks()) {
    const region = Region.locationInRegion(bl, data.dimension.type)
    if (!region) return
    if (!region.permissions?.pvp) return (data.cancel = true)
    for (const id of region.permissions.owners) RAID_NOTIFY[id] = 60
  }
})

const RAID = new ScoreboardDB('raid', 'Raid')
new LockAction(
  player => RAID.get(player) > 0,
  'Вы находитесь в режиме рейдблока.'
)

system.runInterval(
  () => {
    for (const id in RAID_NOTIFY) {
      // Ищем игрока...
      const player = Player.fetch(id)
      if (player) {
        if (RAID.get(player) === 0) {
          player.tell(
            '§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.'
          )
          player.playSound('mob.wolf.bark')
        }
        RAID.set(player.id, RAID_NOTIFY[id])
        delete RAID_NOTIFY[id]
        continue
      }

      RAID_NOTIFY[id]--
      if (RAID_NOTIFY[id] <= 0) {
        // Время вышло, игрока не было
        delete RAID_NOTIFY[id]
        continue
      }
    }
  },
  'raid notify',
  20
)
