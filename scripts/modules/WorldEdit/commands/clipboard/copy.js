import { WorldEdit } from '../../class/WorldEdit.js'

new Command({
  name: 'copy',
  description: 'Копирует зону',
  role: 'moderator',
  type: 'we',
}).executes(ctx => {
  const WEBUILD = WorldEdit.forPlayer(ctx.sender)
  const status = WEBUILD.copy()
  if (status) ctx.reply(status)
})
