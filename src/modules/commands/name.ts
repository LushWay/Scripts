import { world } from '@minecraft/server'
import { i18n } from 'lib/i18n/text'

const name = new Command('name')
  .setDescription(i18n`Меняет имя`)
  .setPermissions('admin')
  .executes(ctx => {
    ctx.player.tell(ctx.player.nameTag)
  })

name
  .overload('set')
  .string('new name')
  .executes((ctx, newname) => {
    ctx.player.nameTag = newname
    ctx.player.success(i18n`Изменено на ${newname}`)
  })

const reset = name.overload('reset').executes(ctx => {
  ctx.player.nameTag = ctx.player.name
})

reset.overload('all').executes(() => {
  for (const player of world.getPlayers()) player.nameTag = player.name
})
