import { Player } from '@minecraft/server'
import { is, ModalForm } from 'lib'
import { selectPlayer } from 'lib/form/select-player'
import { i18n, noI18n } from 'lib/i18n/text'

new Command('pid')
  .setDescription(i18n`Выдает ваш айди`)
  .executes(ctx =>
    pid(
      ctx.player.id,
      ctx.player.name,
      ctx.player,
      is(ctx.player.id, 'techAdmin') ? () => playersPid(ctx.player) : () => void 0,
    ),
  )

  .overload('get')
  .setPermissions('techAdmin')
  .setDescription(noI18n`Открывает форму для получения айди других игроков`)
  .executes(ctx => playersPid(ctx.player))

function playersPid(player: Player) {
  selectPlayer(player, 'PID').then(({ id, name }) => {
    pid(id, name, player, () => playersPid(player))
  })
}

function pid(id: string, name: string, player: Player, then: VoidFunction) {
  new ModalForm('PlayerID').addTextField(name, 'pid', id).show(player, then)
}
