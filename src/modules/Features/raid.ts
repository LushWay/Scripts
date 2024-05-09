import { Player, system, world } from '@minecraft/server'
import { LockAction, Region, util } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'

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

const RAID_LOCKTEXT = 'Вы находитесь в режиме рейдблока.'
new LockAction(player => {
  const raidLockTime = player.scores.raid

  if (raidLockTime > 0) {
    const { value: parsedTime, type } = util.ms.remaining(raidLockTime * 1000, {
      converters: ['sec', 'min', 'hour', 'day'],
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
      const player = Player.getById(id)
      if (player) {
        if (player.scores.raid === 0) {
          player.tell('§4§l> §r§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.')
          player.playSound('mob.wolf.bark')
        }

        player.scores.raid = RAID_NOTIFY[id]

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

    const objective = ScoreboardDB.objective('raid')
    for (const { participant, score } of objective.getScores()) {
      if (score > 1) {
        objective.addScore(participant, -1)
      } else {
        objective.removeParticipant(participant)
      }
    }
  },
  'raid notify',
  20,
)
const RAID_NOTIFY: Record<string, number> = {}
