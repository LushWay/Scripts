import { WEBUILD } from '../../builders/WorldEditBuilder.js'

new XCommand({
  name: 'copy',
  description: 'Копирует зону',
  role: 'moderator',
  type: 'we',
}).executes(ctx => {
  const status = WEBUILD.copy()
  if (status) ctx.reply(status)
})
