import { Player, ScoreName, ScoreNames } from '@minecraft/server'
import {
  ActionForm,
  capitalize,
  Menu,
  ScoreboardDB,
  scoreboardDisplayNames,
  scoreboardObjectiveNames,
  Settings,
} from 'lib'
import { NewFormCallback } from 'lib/form/new'
import { t, TextTable, textTable } from 'lib/i18n/text'

new Command('stats').setDescription(t`Показывает статистику по игре`).executes(ctx => showStats(ctx.player))

const getSettings = Settings.player(...Menu.settings, {
  statsRelative: {
    name: t`Показывать относительную дату`,
    description: t`Показывать относительную дату на экране статистики`,
    value: true,
  },
})

export function showStats(player: Player, targetId = player.id, back?: NewFormCallback) {
  const settings = getSettings(player)
  const scores = ScoreboardDB.getOrCreateProxyFor(targetId)

  function formatDate(date: number) {
    if (settings.statsRelative) {
      return t.timeHHMMSS(date)
    } else {
      const secsTotal = Math.floor(date / 1000)

      const days = t`${Math.floor(secsTotal / 86400)} дней`
      const hours = t`${Math.floor(secsTotal / 3600) % 24} часов`
      const mins = t`${Math.floor(secsTotal / 60) % 60} минут`
      const secs = t`${secsTotal % 60} секунд`
      return `${days} ${hours} ${mins} ${secs}`
    }
  }

  new ActionForm(
    t.header`Статистика игрока ${Player.name(targetId)}`,
    textTable([
      [scoreboardDisplayNames.totalOnlineTime, formatDate(scores.totalOnlineTime)],
      [scoreboardDisplayNames.anarchyOnlineTime, formatDate(scores.anarchyOnlineTime)],
      [' ', ''],
      [scoreboardDisplayNames.lastSeenDate, t.time(Date.now() - scores.lastSeenDate * 1000)],
      [scoreboardDisplayNames.anarchyLastSeenDate, t.time(Date.now() - scores.anarchyLastSeenDate * 1000)],
      ['  ', ''],
      ...statsTable(
        scores,
        key => key,
        n => n,
      ),
      ['   ', ''],
      ...statsTable(
        scores,
        key => `anarchy${capitalize(key)}`,
        n => t`Анархия ${n}`,
      ),
    ]).toString(player.lang),
  )
    .button('OK', () => null)
    .addButtonBack(back)
    .show(player)
}

function statsTable(s: Player['scores'], getKey: (k: ScoreNames.Stat) => ScoreName, getN: (n: string) => string) {
  const table: TextTable[number][] = []
  for (const key of scoreboardObjectiveNames.stats) {
    const k = getKey(key)
    table.push([getN(scoreboardDisplayNames[k]), s[k]])
    if (key === 'kills') table.push([getN(t`Убийств/Смертей`), s[getKey('kills')] / s[getKey('deaths')]])
    if (key === 'damageGive')
      table.push([getN(t`Нанесено/Получено`), s[getKey('damageGive')] / s[getKey('damageRecieve')]])
  }
  return table satisfies TextTable
}
