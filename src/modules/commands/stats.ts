import { Player } from '@minecraft/server'
import { ActionForm, Menu, scoreboardDisplayNames, Settings } from 'lib'
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
      [scoreboardDisplayNames.blocksBroken]: target.scores.blocksBroken,
      [scoreboardDisplayNames.blocksPlaced]: target.scores.blocksPlaced,
      [scoreboardDisplayNames.deaths]: target.scores.deaths,
      [scoreboardDisplayNames.kills]: target.scores.kills,
      'Убийств/Смертей': target.scores.kills / target.scores.deaths,
      [scoreboardDisplayNames.damageRecieve]: target.scores.damageRecieve,
      [scoreboardDisplayNames.damageGive]: target.scores.damageGive,
      'Нанесено/Получено': target.scores.damageGive / target.scores.damageRecieve,
    }),
  )
    .addButton('OK', () => null)
    .addButtonBack(back)
    .show(player)
}
