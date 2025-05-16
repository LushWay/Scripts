import { system, world } from '@minecraft/server'
import { LockAction, Region, ms } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { MineareaRegion } from 'lib/region/kinds/minearea'
import { isScheduledToPlace } from 'lib/scheduled-block-place'
import { t } from 'lib/text'
import { BaseRegion } from 'modules/places/base/region'
import { StoneQuarry } from 'modules/places/stone-quarry/stone-quarry'

const notify = new Map<string, { time: number; reason: string }>()
const targetLockTime = ms.from('min', 8)
const raiderLockTime = ms.from('min', 10)
const objective = ScoreboardDB.objective('raid')

world.beforeEvents.explosion.subscribe(event => {
  let base = false
  const impactedBlocks = event.getImpactedBlocks().filter(block => {
    const region = Region.getAt(block)
    if (region instanceof MineareaRegion || region === StoneQuarry.wither.region) return true
    if (isScheduledToPlace(block, block.dimension.type)) return true
    if (region instanceof BaseRegion) {
      for (const id of region.permissions.owners) notify.set(id, { time: targetLockTime, reason: 'вас рейдят' })
      base = true
      return true
    }

    return false
  })

  if ((base as boolean) && event.source && impactedBlocks.length)
    notify.set(event.source.id, { time: raiderLockTime, reason: 'вы разрушили блок на базе' })

  event.setImpactedBlocks(impactedBlocks)
})

const locktext = 'Вы находитесь в режиме рейдблока.'
new LockAction(player => {
  const raidLockTime = player.scores.raid
  if (raidLockTime > 0) {
    console.log(new Error('aaa'))
    return { lockText: `${locktext} Осталось ${t.error.time(raidLockTime * 1000)}` }
  } else return false
}, locktext)

system.runInterval(
  () => {
    const players = world.getAllPlayers().map(e => ({ player: e, id: e.id }))
    for (const [id, { time, reason }] of notify) {
      // Ищем игрока...
      const player = players.find(e => e.id === id)?.player
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
