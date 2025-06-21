import { Player } from '@minecraft/server'
import { InventoryInterval, ScoreboardDB } from 'lib'
import { form } from 'lib/form/new'
import { t } from 'lib/text'
import { BaseItem } from 'modules/places/base/base'

export enum SpeedRunTarget {
  GetBaseItem = 'GetBaseItem',
  FullNetheriteArmor = 'FullNetheriteArmor',
  AllQuests = 'AllQuests',
  AllAchievements = 'AllAchievements',
  MillionOfMoney = 'MillionOfMoney',
}

const speedRunNames: Record<SpeedRunTarget, string> = {
  [SpeedRunTarget.AllAchievements]: 'Все достижения',
  [SpeedRunTarget.GetBaseItem]: 'Получить базу',
  [SpeedRunTarget.AllQuests]: 'Все задания',
  [SpeedRunTarget.MillionOfMoney]: '1.000.000 монет',
  [SpeedRunTarget.FullNetheriteArmor]: 'Полная незеритовая броня',
}

const objectives: Record<SpeedRunTarget, ScoreboardDB> = Object.fromEntries(
  Object.entriesStringKeys(speedRunNames).map(([target, name]) => {
    const key = `${target}SpeedRun`
    ScoreboardDB.defineName(key, name)
    return [target, new ScoreboardDB(key, name)]
  }),
)

function finishSpeedRun(player: Player, target: SpeedRunTarget) {
  if (!player.database.speedrunTarget) return

  player.database.speedrunTarget.finished = true
  const took = player.scores.anarchyOnlineTime * 2.5 // ms
  const previous = objectives[target].get(player)

  const name = speedRunNames[target]
  if (previous === 0 || took < previous) {
    objectives[target].set(player, took)
    if (previous === 0) {
      player.success(t`Ваш первый рекорд ${name} поставлен! Это заняло ${t.timeHHMMSS(took)}`)
    } else {
      player.success(t`Вы побили ваш предыдущий рекорд ${name}! ${t.timeHHMMSS(took)} -> ${t.timeHHMMSS(previous)}`)
    }
  } else {
    player.fail(
      t`Вы не смогли побить ваш предыдущий рекорд ${name}! ${t.timeHHMMSS(took)} -> ${t.timeHHMMSS(previous)}`,
    )
  }
}

function isSpeedRunningFor(player: Player, target: SpeedRunTarget) {
  return player.database.speedrunTarget?.target === target && !player.database.speedrunTarget.finished
}

declare module '@minecraft/server' {
  interface PlayerDatabase {
    speedrunTarget?: {
      target: string
      finished: boolean
    }
  }
}

const baseTypeId = BaseItem.itemStack.typeId
InventoryInterval.slots.subscribe(({ player, slot }) => {
  if (!isSpeedRunningFor(player, SpeedRunTarget.GetBaseItem)) return
  if (slot.isValid && slot.typeId === baseTypeId && BaseItem.isItem(slot.getItem())) {
    finishSpeedRun(player, SpeedRunTarget.GetBaseItem)
  }
})

const speedrunForm = form((f, player) => {
  f.title('Speedrun')
  for (const [target, name] of Object.entries(speedRunNames)) {
    f.button(name, () => {
      player.database.speedrunTarget = {
        target,
        finished: false,
      }
      player.info(t`Спидран '${name}' начат. Для сброса времени воспользуйтесь .wipe`)
    })
  }
})

new Command('target').setAliases('speedrun').executes(speedrunForm.command)
