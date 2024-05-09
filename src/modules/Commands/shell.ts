import { ActionForm, ModalForm, util } from 'lib'
import { request } from 'lib/bds/api'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('shell').setPermissions('techAdmin').executes(ctx => {
  const form = new ActionForm('Shell')
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton('git pull', () => {
      const form = new ActionForm('Type')
      /** @type {('script' | 'server' | 'process')[]} */
      const types = ['script', 'server', 'process']
      for (const type of types) {
        // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          request('gitPull', { restartType: type })
            .then(s => ctx.player.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.player)
    })
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton('git status', () => {
      const form = new ActionForm('Type')
      /** @type {('sm-api' | 'root')[]} */
      const cwds = ['sm-api', 'root']
      for (const type of cwds) {
        // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
        form.addButton(type, () => {
          ctx.reply('§6> §rПринято.')
          request('gitStatus', { cwd: type })
            .then(s => ctx.player.tell(s.statusMessage))
            .catch(util.error)
        })
      }
      form.show(ctx.player)
    })
    // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
    .addButton('Backup', () => {
      new ModalForm('Backup')
        // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
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
