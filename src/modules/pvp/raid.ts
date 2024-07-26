import { Player, system, world } from '@minecraft/server'
import { LockAction, Region, ms } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { t } from 'lib/text'

const notify = new Map<string, { time: number; reason: string }>()
const targetLockTime = ms.from('min', 8) / 20 / 1000
const raiderLockTime = ms.from('min', 10) / 20 / 1000

world.beforeEvents.explosion.subscribe(event => {
  const impactedBlocks = event.getImpactedBlocks().filter(block => {
    const region = Region.nearestRegion(block, event.dimension.type)
    if (region?.permissions.pvp) {
      for (const id of region.permissions.owners) notify.set(id, { time: targetLockTime, reason: 'вас рейдят' })
      return true
    }
  })

  if (event.source && impactedBlocks.length)
    notify.set(event.source.id, { time: raiderLockTime, reason: 'вы разрушили блок на базе' })
  event.setImpactedBlocks(impactedBlocks)
})

const locktext = 'Вы находитесь в режиме рейдблока.'
new LockAction(player => {
  const raidLockTime = player.scores.raid
  if (raidLockTime > 0) {
    return { lockText: `${locktext} Осталось ${t.error.time(raidLockTime * 1000)}` }
  } else return false
}, locktext)

system.runInterval(
  () => {
    for (const [id, { time, reason }] of notify) {
      // Ищем игрока...
      const player = Player.getById(id)
      if (player) {
        if (player.scores.raid === 0) {
          player.tell(
            t.error`§4§l> §r§cВы вошли в режим рейдблока, потому что ${reason}. Некоторые функции могут быть недоступны`,
          )
          player.playSound('mob.wolf.bark')
        }

        player.scores.raid = time
        notify.delete(id)
        continue
      }

      if (time <= 0) {
        // Время вышло, игрока не было
        notify.delete(id)
        continue
      } else notify.set(id, { time: time - 1, reason })
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
