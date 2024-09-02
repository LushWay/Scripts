import { Player } from '@minecraft/server'
import { ActionForm, Menu, Settings } from 'lib'
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

  const form = new ActionForm(
    t.header`Статистика игрока ${target.name}`,
    textTable({
      'Времени на сервере': formatDate(target.scores.totalOnlineTime),
      'Времени на анархии': formatDate(target.scores.anarchyOnlineTime),
      'Блоков сломано': target.scores.blocksBroken,
      'Блоков поставлено': target.scores.blocksPlaced,
      'Смертей': target.scores.deaths,
      'Убийств': target.scores.kills,
      'Убийств/Смертей': target.scores.kills / target.scores.deaths,
      'Урона получено': target.scores.damageRecieve,
      'Урона нанесено': target.scores.damageGive,
      'Нанесено/Получено': target.scores.damageGive / target.scores.damageRecieve,
    }),
  )

  form.addButton('OK', () => null)
  if (back) form.addButtonBack(back)
  form.show(player)
}
