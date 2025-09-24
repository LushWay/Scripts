import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { getFullname } from 'lib/get-fullname'
import { noI18n } from 'lib/i18n/text'
import { ms } from 'lib/utils/ms'
import { Chat } from './chat'

export function muteInfo(
  player: Player,
  mute: { readonly mutedUntil: number; readonly reason?: string | undefined },
): void {
  return player.fail(
    noI18n.error`Вы замьючены в чате до ${new Date(mute.mutedUntil).toYYYYMMDD()} ${new Date(mute.mutedUntil).toHHMM()}${mute.reason ? noI18n.error` по причине: ${mute.reason}` : ''}`,
  )
}
new Command('mute')
  .setDescription('Заглушить игрока в чате')
  .setPermissions('helper')
  .executes(ctx => {
    selectPlayer(ctx.player, 'замутить').then(e => {
      new ModalForm('Мут ' + e.name)
        .addTextField('Время', 'введи', '5')
        .addDropdownFromObject('Тип времени', {
          min: 'Минуты',
          hour: 'Часы',
        })
        .addTextField('Причина', 'опиши чтобы знал что делать нельзя')
        .show(ctx.player, (formctx, timeRaw, type, reason) => {
          const time = parseInt(timeRaw)
          if (isNaN(time)) return formctx.error(`${timeRaw} это не число`)

          const actualTime = ms.from(type, time)
          Chat.muteDb.set(e.id, { mutedUntil: Date.now() + actualTime, reason })
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (e.player) muteInfo(e.player, Chat.muteDb.get(e.id)!)
          ctx.player.success()
        })
    })
  })
new Command('unmute')
  .setDescription('Вернуть обратно')
  .setPermissions('helper')
  .executes(ctx => {
    new ArrayForm('Муты', Chat.muteDb.entries())
      .button(([id, info]) => {
        if (!info) return false
        const until = `До: ${new Date(info.mutedUntil).toYYYYMMDD()} ${new Date(info.mutedUntil).toHHMM()}`
        return [
          `${getFullname(id)} ${until}\n${info.reason}`,
          form((f, { self }) => {
            f.title(getFullname(id))
            f.body(`Причина: ${info.mutedUntil}\n${until}`)
            f.button('Размутить', () => {
              Chat.muteDb.delete(id)
              self()
            })
          }).show,
        ]
      })
      .show(ctx.player)
  })
