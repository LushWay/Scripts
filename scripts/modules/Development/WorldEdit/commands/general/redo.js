import { WEBUILD } from '../../builders/WorldEditBuilder.js'

new XCommand({
  type: 'we',
  name: 'redo',
  description: 'Возвращает последнее действие (из памяти)',
  role: 'moderator',
})
  .int('redoCount', true)
  .executes((ctx, r) => {
    const status = WEBUILD.redo(!isNaN(r) ? r : 1)
    if (status) ctx.reply(status)
  })
