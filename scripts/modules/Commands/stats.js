import { Player } from '@minecraft/server'
import { ActionForm } from 'lib'

const stats = new Command('stats').setDescription('Показывает статистику по игре')

stats.executes(ctx => showStats(ctx.player))

/** @param {Player} player */
function showStats(player) {
  const secsOnlineAnarchy = Math.floor(player.scores.anarchyOnlineTime / 1000)
  const daysOnlineStrAnarchy = `${Math.floor(secsOnlineAnarchy / 86400)} дней`
  const hoursOnlineStrAnarchy = `${Math.floor(secsOnlineAnarchy / 3600) % 24} часов`
  const minsOnlineStrAnarchy = `${Math.floor(secsOnlineAnarchy / 60) % 60} минут`
  const secsOnlineStrAnarchy = `${secsOnlineAnarchy % 60} секунд`
  const timeOnlineAnarchy = `${daysOnlineStrAnarchy} ${hoursOnlineStrAnarchy} ${minsOnlineStrAnarchy} ${secsOnlineStrAnarchy}`

  const secsOnline = Math.floor(player.scores.totalOnlineTime / 1000)
  const daysOnlineStr = `${Math.floor(secsOnline / 86400)} дней`
  const hoursOnlineStr = `${Math.floor(secsOnline / 3600) % 24} часов`
  const minsOnlineStr = `${Math.floor(secsOnline / 60) % 60} минут`
  const secsOnlineStr = `${secsOnline % 60} секунд`
  const timeOnline = `${daysOnlineStr} ${hoursOnlineStr} ${minsOnlineStr} ${secsOnlineStr}`

  const form = new ActionForm(
    'Статистика',
    `§f§lСтатистика игрока§r
§cВремени на анархии:§r ${timeOnlineAnarchy}
§6Времени на сервере§r: ${timeOnline}
§eБлоков сломано§r: ${player.scores.blocksBroken}
§aБлоков поставлено§r: ${player.scores.blocksPlaced}
§bСмертей§r: ${player.scores.deaths}
§9Убийств§r: ${player.scores.kills}
§5Урона получено§r: ${player.scores.damageRecieve}
§dУрона нанесено§r: ${player.scores.damageGive}`,
  )
  form.addButton('OK', () => null)
  form.show(player)
}

