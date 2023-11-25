import { APIRequest } from 'lib/Class/Net.js'
import { ActionForm, util } from 'smapi.js'

new Command({
  name: 'shell',
  role: 'admin',
}).executes(ctx => {
  new ActionForm('Shell')
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
    .show(ctx.sender)
})
