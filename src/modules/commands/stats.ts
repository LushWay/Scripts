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
import { i18n, TextTable, textTable } from 'lib/i18n/text'

new Command('stats').setDescription(i18n`Показывает статистику по игре`).executes(ctx => showStats(ctx.player))

const getSettings = Settings.player(...Menu.settings, {
  statsRelative: {
    name: i18n`Показывать относительную дату`,
    description: i18n`Показывать относительную дату на экране статистики`,
    value: true,
  },
})

export function showStats(player: Player, targetId = player.id, back?: NewFormCallback) {
  const settings = getSettings(player)
  const scores = ScoreboardDB.getOrCreateProxyFor(targetId)

  function formatDate(date: number) {
    if (settings.statsRelative) {
      return i18n.hhmmss(date)
    } else {
      const secsTotal = Math.floor(date / 1000)

      const days = i18n`${Math.floor(secsTotal / 86400)} дней`
      const hours = i18n`${Math.floor(secsTotal / 3600) % 24} часов`
      const mins = i18n`${Math.floor(secsTotal / 60) % 60} минут`
      const secs = i18n`${secsTotal % 60} секунд`
      return `${days} ${hours} ${mins} ${secs}`
    }
  }

  new ActionForm(
    i18n.header`Статистика игрока ${Player.name(targetId)}`.toString(player.lang),
    textTable([
      [scoreboardDisplayNames.totalOnlineTime, formatDate(scores.totalOnlineTime)],
      [scoreboardDisplayNames.anarchyOnlineTime, formatDate(scores.anarchyOnlineTime)],
      [' ', ''],
      [scoreboardDisplayNames.lastSeenDate, i18n.time(Date.now() - scores.lastSeenDate * 1000)],
      [scoreboardDisplayNames.anarchyLastSeenDate, i18n.time(Date.now() - scores.anarchyLastSeenDate * 1000)],
      ['  ', ''],
      ...statsTable(
        scores,
        key => key,
        n => n.toString(player.lang),
      ),
      ['   ', ''],
      ...statsTable(
        scores,
        key => `anarchy${capitalize(key)}`,
        n => i18n`Анархия ${n}`.toString(player.lang),
      ),
    ]).toString(player.lang),
  )
    .button('OK', () => null)
    .addButtonBack(back)
    .show(player)
}

function statsTable(s: Player['scores'], getKey: (k: ScoreNames.Stat) => ScoreName, getN: (n: Text) => string) {
  const table: TextTable[number][] = []
  for (const key of scoreboardObjectiveNames.stats) {
    const k = getKey(key)
    table.push([getN(scoreboardDisplayNames[k]), s[k]])
    if (key === 'kills') table.push([getN(i18n`Убийств/Смертей`), s[getKey('kills')] / s[getKey('deaths')]])
    if (key === 'damageGive')
      table.push([getN(i18n`Нанесено/Получено`), s[getKey('damageGive')] / s[getKey('damageRecieve')]])
  }
  return table satisfies TextTable
}
