import { Player, system, world } from '@minecraft/server'
import { LockAction, Region, ScoreboardDB, util } from 'smapi.js'

world.beforeEvents.explosion.subscribe(event => {
  const impactedBlocks = event.getImpactedBlocks().filter(block => {
    const region = Region.locationInRegion(block, event.dimension.type)
    if (region && region.permissions.pvp) {
      for (const id of region.permissions.owners) RAID_NOTIFY[id] = 60
      return true
    }
  })
  if (event.source && impactedBlocks.length) RAID_NOTIFY[event.source.id] = 120
  event.setImpactedBlocks(impactedBlocks)
})

const RAID = new ScoreboardDB('raid', 'Raid')
const RAID_LOCKTEXT = 'Вы находитесь в режиме рейдблока.'
new LockAction(player => {
  const raidLockTime = RAID.get(player)

  if (raidLockTime > 0) {
    const { parsedTime, type } = util.ms.remaining(raidLockTime * 1000, {
      timeTypes: ['sec', 'min', 'hour', 'day'],
    })
    return {
      lockText: `${RAID_LOCKTEXT} Осталось ${parsedTime} ${type}`,
    }
  } else return false
}, RAID_LOCKTEXT)

system.runInterval(
  () => {
    for (const id in RAID_NOTIFY) {
      // Ищем игрока...
      const player = Player.fetch(id)
      if (player) {
        if (RAID.get(player) === 0) {
          player.tell('§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.')
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

    for (const participiant of RAID.scoreboard.getParticipants()) {
      const score = RAID.get(participiant.displayName)
      if (score > 1) {
        RAID.add(participiant.displayName, -1)
      } else {
        RAID.scoreboard.removeParticipant(participiant)
      }
    }
  },
  'raid notify',
  20
)
/**
 * @type {Record<string, number>}
 */
export const RAID_NOTIFY = {}
