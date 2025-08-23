import {} from '@minecraft/server'
import { Vec } from 'lib'
import { CommandContext } from 'lib/command/context'
import { i18n } from 'lib/i18n/text'
import { WorldEdit } from 'modules/world-edit/lib/world-edit'

function getSelection(ctx: CommandContext) {
  const we = WorldEdit.forPlayer(ctx.player)
  if (!we.selection) return ctx.reply('§cЗона не выделена!')

  return we
}

const command = new Command('size')
  .setGroup('we')
  .setDescription('Размер выделенной зоны')
  .setPermissions('builder')
  .executes(ctx => {
    const we = getSelection(ctx)
    if (!we) return

    ctx.reply(`§3В выделенной зоне §f${Vec.size(we.pos1, we.pos2)}§3 блоков`)
  })

command
  .overload('is_in')
  .setDescription('Проверяет, находится ли координата внутри выделенной зоны')
  .location('location', true)
  .executes((ctx, location = ctx.player.location) => {
    const we = getSelection(ctx)
    if (!we) return

    const isIn = Vec.isBetween(we.pos1, we.pos2, location)
    ctx.reply(
      (isIn
        ? i18n
        : i18n.error)`Позиция ${Vec.string(Vec.floor(location), true)}${isIn ? '' : ' не'} находится внутри выделенной зоны.`,
    )
  })

command
  .overload('tp')
  .setDescription('Телепортирует в выделенную зону')
  .executes(ctx => {
    const we = getSelection(ctx)
    if (!we) return

    ctx.player.teleport(we.pos1)
    ctx.player.success('Успешно!')
  })
