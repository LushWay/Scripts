import { Player } from '@minecraft/server'
import { ActionForm, Menu, Settings, util } from 'lib'
import { t } from 'lib/text'

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

  const form = new ActionForm(
    'Статистика',
    `§f§lСтатистика игрока §r§f${target.name}§r
§cВремени на анархии:§r ${formatDate(target.scores.anarchyOnlineTime)}
§6Времени на сервере§r: ${formatDate(target.scores.totalOnlineTime)}
§eБлоков сломано§r: ${target.scores.blocksBroken}
§aБлоков поставлено§r: ${target.scores.blocksPlaced}
§bСмертей§r: ${target.scores.deaths}
§9Убийств§r: ${target.scores.kills}
§5Урона получено§r: ${target.scores.damageRecieve}
§dУрона нанесено§r: ${target.scores.damageGive}`,
  )

  form.addButton('OK', () => null)
  if (back) form.addButtonBack(back)
  form.show(player)
}
