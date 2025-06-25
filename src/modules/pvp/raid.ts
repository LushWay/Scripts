import { Block, Entity, system, world } from '@minecraft/server'
import { LockAction, ms, Region } from 'lib'
import { ScoreboardDB } from 'lib/database/scoreboard'
import { i18n } from 'lib/i18n/text'
import { MineareaRegion } from 'lib/region/kinds/minearea'
import { ScheduleBlockPlace } from 'lib/scheduled-block-place'
import { BaseRegion } from 'modules/places/base/region'

const notify = new Map<string, { time: number; reason: Text }>()
const targetLockTime = ms.from('min', 8)
const raiderLockTime = ms.from('min', 10)
const objective = ScoreboardDB.objective('raid')

world.beforeEvents.explosion.subscribe(event => {
  const checker = createBlockExplosionChecker()
  const impactedBlocks = event.getImpactedBlocks().filter(checker.canBlockExplode)
  if (impactedBlocks.length) checker.raidLock(event.source)

  event.setImpactedBlocks(impactedBlocks)
})

export function createBlockExplosionChecker() {
  let base = false

  function canBlockExplode(block: Block) {
    const region = Region.getAt(block)
    if (region instanceof MineareaRegion) return !region.newbie
    if (ScheduleBlockPlace.has(block, block.dimension.type)) return true
    if (region instanceof BaseRegion) {
      if (!base) {
        for (const id of region.permissions.owners) notify.set(id, { time: targetLockTime, reason: i18n`вас рейдят` })
        base = true
      }
      return true
    }

    return false
  }

  function raidLock(source: undefined | Entity) {
    if (base && source) notify.set(source.id, { time: raiderLockTime, reason: i18n`вы разрушили блок на базе` })
  }

  return { canBlockExplode, raidLock }
}

const locktext = i18n`Вы находитесь в режиме рейдблока.`
new LockAction(player => {
  const raidLockTime = player.scores.raid
  if (raidLockTime > 0) {
    return { lockText: i18n`${locktext} Осталось ${i18n.error.hhmmss(raidLockTime)}` }
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
          player.fail(
            i18n.error`Вы вошли в режим рейдблока, потому что ${reason}. Некоторые функции могут быть недоступны`,
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
