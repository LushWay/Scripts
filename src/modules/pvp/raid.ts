import { Player, system, world } from '@minecraft/server'
import { LockAction, Region, ms } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { t } from 'lib/text'

const notify = new Map<string, number>()
const targetLockTime = ms.from('min', 8) / 20
const raiderLockTime = ms.from('min', 10) / 20

world.beforeEvents.explosion.subscribe(event => {
  const impactedBlocks = event.getImpactedBlocks().filter(block => {
    const region = Region.nearestRegion(block, event.dimension.type)
    if (region?.permissions.pvp) {
      for (const id of region.permissions.owners) notify.set(id, targetLockTime)
      return true
    }
  })

  if (event.source && impactedBlocks.length) notify.set(event.source.id, raiderLockTime)
  event.setImpactedBlocks(impactedBlocks)
})

const locktext = 'Вы находитесь в режиме рейдблока.'
new LockAction(player => {
  const raidLockTime = player.scores.raid
  if (raidLockTime > 0) {
    return { lockText: `${locktext} Осталось ${t.error.ttime(raidLockTime * 1000)}` }
  } else return false
}, locktext)

system.runInterval(
  () => {
    for (const [id, num] of notify) {
      // Ищем игрока...
      const player = Player.getById(id)
      if (player) {
        if (player.scores.raid === 0) {
          player.tell('§4§l> §r§cВы вошли в режим рейдблока. Некоторые функции могут быть недоступны.')
          player.playSound('mob.wolf.bark')
        }

        player.scores.raid = num
        notify.delete(id)
        continue
      }

      notify.set(id, num - 1)
      if (num - 1 <= 0) {
        // Время вышло, игрока не было

        notify.delete(id)

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
