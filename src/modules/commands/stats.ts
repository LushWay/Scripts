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
import { t, textTable } from 'lib/text'

new Command('stats').setDescription('Показывает статистику по игре').executes(ctx => showStats(ctx.player))

const getSettings = Settings.player(...Menu.settings, {
  statsRelative: {
    name: 'Показывать относительную дату',
    description: 'Показывать относительную дату на экране статистики',
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

      const days = `${Math.floor(secsTotal / 86400)} дней`
      const hours = `${Math.floor(secsTotal / 3600) % 24} часов`
      const mins = `${Math.floor(secsTotal / 60) % 60} минут`
      const secs = `${secsTotal % 60} секунд`
      return `${days} ${hours} ${mins} ${secs}`
    }
  }

  new ActionForm(
    t.header`Статистика игрока ${Player.name(targetId)}`,
    textTable({
      [scoreboardDisplayNames.totalOnlineTime]: formatDate(scores.totalOnlineTime),
      [scoreboardDisplayNames.anarchyOnlineTime]: formatDate(scores.anarchyOnlineTime),
      [' ']: '',
      [scoreboardDisplayNames.lastSeenDate]: t.time(Date.now() - scores.lastSeenDate * 1000),
      [scoreboardDisplayNames.anarchyLastSeenDate]: t.time(Date.now() - scores.anarchyLastSeenDate * 1000),
      ['  ']: '',
      ...statsTable(
        scores,
        key => key,
        n => n,
      ),
      ['   ']: '',
      ...statsTable(
        scores,
        key => `anarchy${capitalize(key)}`,
        n => `Анархия ${n}`,
      ),
    }),
  )
    .addButton('OK', () => null)
    .addButtonBack(back)
    .show(player)
}

function statsTable(s: Player['scores'], getKey: (k: ScoreNames.Stat) => ScoreName, getN: (n: string) => string) {
  const table: Record<string, number | string> = {}
  for (const key of scoreboardObjectiveNames.stats) {
    const k = getKey(key)
    table[getN(scoreboardDisplayNames[k])] = s[k]
    if (key === 'kills') table[getN('Убийств/Смертей')] = s[getKey('kills')] / s[getKey('deaths')]
    if (key === 'damageGive') table[getN('Нанесено/Получено')] = s[getKey('damageGive')] / s[getKey('damageRecieve')]
  }
  return table
}
