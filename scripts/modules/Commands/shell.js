import { Player } from '@minecraft/server'
import { APIRequest } from 'lib/Class/Net.js'
import { ActionForm, ModalForm, util } from 'smapi.js'

new Command({
  name: 'shell',
  role: 'admin',
}).executes(ctx => {
  const form = new ActionForm('Shell')
    .addButton('git pull', () => {
      const form = new ActionForm('Type')
      /** @type {("script" | "server" | "process")[]} */
      const types = ['script', 'server', 'process']
      for (const type of types) {
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          APIRequest('gitPull', { restartType: type })
            .then(s => ctx.sender.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.sender)
    })
    .addButton('git status', () => {
      const form = new ActionForm('Type')
      /** @type {("sm-api" | "root")[]} */
      const cwds = ['sm-api', 'root']
      for (const type of cwds) {
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          APIRequest('gitStatus', { cwd: type })
            .then(s => ctx.sender.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.sender)
    })
    .addButton('Backup', () => {
      new ModalForm('Backup')
        .addTextField('Backup commit name\nЛучше всего то, что значимого было изменено', 'ничего не произойдет')
        .show(ctx.sender, (_, backupname) => {
          ctx.reply('§6> §rПринято.')
          APIRequest('backup', { name: backupname })
            .then(s => ctx.sender.tell(s.statusMessage))
            .catch(util.error)
        })
    })

  form.addButton('Console', () => showConsole(ctx.sender, pages[ctx.sender.id], () => form.show(ctx.sender)))

  form.show(ctx.sender)
})

/** @type {Record<string, number>} */
const pages = {}
const eachPage = 150

/**
 * @param {Player} player
 * @param {number} page
 */
async function showConsole(player, page, back = () => {}) {
  player.tell('Загрузка консоли...')

  if (typeof page === 'undefined') page = 0
  pages[player.id] = page

  const { text } = await APIRequest('console', { offset: eachPage * page, size: eachPage })

  new ActionForm('Console', text)
    .addButton('< Prev', () => showConsole(player, page - 1))
    .addButton('Back', () => showConsole(player, page - 1))
    .addButton('Next >', () => showConsole(player, page + 1))
}
