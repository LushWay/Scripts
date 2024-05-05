import { ActionForm, ModalForm, util } from 'lib.js'
import { request } from 'lib/BDS/api.js'

new Command('shell').setPermissions('techAdmin').executes(ctx => {
  const form = new ActionForm('Shell')
    .addButton('git pull', () => {
      const form = new ActionForm('Type')
      /** @type {('script' | 'server' | 'process')[]} */
      const types = ['script', 'server', 'process']
      for (const type of types) {
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          request('gitPull', { restartType: type })
            .then(s => ctx.player.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.player)
    })
    .addButton('git status', () => {
      const form = new ActionForm('Type')
      /** @type {('sm-api' | 'root')[]} */
      const cwds = ['sm-api', 'root']
      for (const type of cwds) {
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          request('gitStatus', { cwd: type })
            .then(s => ctx.player.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.player)
    })
    .addButton('Backup', () => {
      new ModalForm('Backup')
        .addTextField('Backup commit name\nЛучше всего то, что значимого было изменено', 'ничего не произойдет')
        .show(ctx.player, (_, backupname) => {
          ctx.reply('§6> §rПринято.')
          request('backup', { name: backupname })
            .then(s => ctx.player.tell(s.statusMessage))
            .catch(util.error)
        })
    })

  form.show(ctx.player)
})
