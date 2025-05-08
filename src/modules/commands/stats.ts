import { Player, ScoreName, ScoreNames } from '@minecraft/server'
import { ActionForm, scoreboardObjectiveNames, capitalize, Menu, scoreboardDisplayNames, Settings } from 'lib'
import { t, textTable } from 'lib/text'

new Command('stats').setDescription('Показывает статистику по игре').executes(ctx => showStats(ctx.player))

const getSettings = Settings.player(...Menu.settings, {
  statsRelative: {
    name: 'Показывать относительную дату',
    description: 'Показывать относительную дату на экране статистики',
    value: true,
  },
})

function showStats(player: Player, target: Player = player, back?: VoidFunction) {
  const settings = getSettings(player)

  function formatDate(date: number) {
    if (settings.statsRelative) {
      return t.time`${date}`
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
    t.header`Статистика игрока ${target.name}`,
    textTable({
      [scoreboardDisplayNames.totalOnlineTime]: formatDate(target.scores.totalOnlineTime),
      [scoreboardDisplayNames.anarchyOnlineTime]: formatDate(target.scores.anarchyOnlineTime),
      [scoreboardDisplayNames.lastSeenDate]: t.time`${target.scores.lastSeenDate}`,
      [scoreboardDisplayNames.anarchyLastSeenDate]: t.time`${target.scores.anarchyLastSeenDate}`,
      ...statsTable(target, key => key),
      ...statsTable(target, key => `anarchy${capitalize(key)}`),
    }),
  )
    .addButton('OK', () => null)
    .addButtonBack(back)
    .show(player)
}

function statsTable(target: Player, getKey: (k: ScoreNames.Stat) => ScoreName) {
  const s = target.scores
  const table: Record<string, number | string> = {}
  for (const key of scoreboardObjectiveNames.stats) {
    const k = getKey(key)
    table[scoreboardDisplayNames[k]] = s[k]
    if (key === 'kills') table['Убийств/Смертей'] = s[getKey('kills')] / s[getKey('deaths')]
    if (key === 'damageGive') table['Нанесено/Получено'] = s[getKey('damageGive')] / s[getKey('damageRecieve')]
  }
  return table
}
