import { world } from '@minecraft/server'
import { t } from 'lib/i18n/text'

const name = new Command('name')
  .setDescription(t`Меняет имя`)
  .setPermissions('admin')
  .executes(ctx => {
    ctx.player.tell(ctx.player.nameTag)
  })

name
  .overload('set')
  .string('new name')
  .executes((ctx, newname) => {
    ctx.player.nameTag = newname
    ctx.player.success(t`Изменено на ${newname}`)
  })

const reset = name.overload('reset').executes(ctx => {
  ctx.player.nameTag = ctx.player.name
})

reset.overload('all').executes(() => {
  for (const player of world.getPlayers()) player.nameTag = player.name
})
