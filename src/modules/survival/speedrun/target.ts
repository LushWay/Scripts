import { Player } from '@minecraft/server'
import { InventoryInterval, ScoreboardDB } from 'lib'
import { defaultLang } from 'lib/assets/lang'
import { form } from 'lib/form/new'
import { i18n, i18nShared } from 'lib/i18n/text'
import { BaseItem } from 'modules/places/base/base'

export enum SpeedRunTarget {
  GetBaseItem = 'GetBaseItem',
  FullNetheriteArmor = 'FullNetheriteArmor',
  AllQuests = 'AllQuests',
  AllAchievements = 'AllAchievements',
  MillionOfMoney = 'MillionOfMoney',
}

const speedRunNames: Record<SpeedRunTarget, SharedText> = {
  [SpeedRunTarget.AllAchievements]: i18nShared`Все достижения`,
  [SpeedRunTarget.GetBaseItem]: i18nShared`Получить базу`,
  [SpeedRunTarget.AllQuests]: i18nShared`Все задания`,
  [SpeedRunTarget.MillionOfMoney]: i18nShared`1.000.000 монет`,
  [SpeedRunTarget.FullNetheriteArmor]: i18nShared`Полная незеритовая броня`,
}

const objectives: Record<SpeedRunTarget, ScoreboardDB> = Object.fromEntries(
  Object.entriesStringKeys(speedRunNames).map(([target, name]) => {
    const key = `${target[0]?.toLowerCase()}${target.slice(1)}SpeedRun`
    ScoreboardDB.defineName(key, name)
    return [target, new ScoreboardDB(key, name.to(defaultLang))]
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
      player.success(i18n`Ваш первый рекорд ${name} поставлен! Это заняло ${i18n.hhmmss(took)}`)
    } else {
      player.success(i18n`Вы побили ваш предыдущий рекорд ${name}! ${i18n.hhmmss(took)} -> ${i18n.hhmmss(previous)}`)
    }
  } else {
    player.fail(
      i18n`Вы не смогли побить ваш предыдущий рекорд ${name}! ${i18n.hhmmss(took)} -> ${i18n.hhmmss(previous)}`,
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

export const speedrunForm = form((f, { player }) => {
  f.title('Speedrun')
  f.body(
    i18n`Вы можете выбрать одну из категорий ниже для спидрана. Время считается только когда вы находитесь на анархии, т.е. пока вы оффлайн время не считается. Ваше время на анархии сейчас: ${i18n.hhmmss(player.scores.anarchyOnlineTime * 2.5)}`,
  )
  for (const [target, name] of Object.entries(speedRunNames)) {
    const selected = player.database.speedrunTarget?.target === target
    f.button((selected ? i18n.header : i18n)`${name}${selected ? i18n.success`\nВыбрано` : ''}`, () => {
      player.database.speedrunTarget = {
        target,
        finished: false,
      }
      player.info(i18n`Спидран '${name}' начат. Для сброса времени воспользуйтесь .wipe`.to(player.lang))
    })
  }
})

new Command('target').setAliases('speedrun').executes(speedrunForm.command)
