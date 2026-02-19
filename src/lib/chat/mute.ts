import { Player } from '@minecraft/server'
import { CommandContext } from 'lib/command/context'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { form } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { getFullname } from 'lib/get-fullname'
import { ms, Time } from 'lib/utils/ms'
import { msold } from 'lib/utils/ms-old'
import { Chat } from './chat'

function mute(type: Time, time: number, reason = 'за поведение', id: string, ctx: CommandContext) {
  const actualTime = ms.from(type, time)
  const muteInfo: Chat.MuteInfo = { mutedUntil: Date.now() + actualTime, reason }
  Chat.getInstance().muteDb.set(id, muteInfo)
  const player = Player.getById(id)
  if (player) Chat.getInstance().informAboutMute(player, muteInfo)

  const timeText = msold.remaining(actualTime)
  ctx.player.success(
    `Игрок ${Player.nameOrUnknown(id)} был замьючен на ${timeText.value} ${timeText.type} по причине: ${reason}`,
  )
}

function findOfflinePlayer(nameArg: string, ctx: CommandContext) {
  for (const [id, data] of Player.database.entriesImmutable()) {
    if (data.name === nameArg) return id
  }
  ctx.error(`Игрок ${nameArg} не найден`)
}

new Command('mute')
  .setDescription('Заглушить игрока в чате')
  .setPermissions('helper')
  .string('name', true)
  .int('time', true)
  .array('timeType', ['min', 'hour', 'day', 'sec'], true)
  .string('reason', true)
  .executes((ctx, nameArg, timeArg = 5, typeArg = 'min', reasonArg) => {
    if (nameArg) {
      if (typeof ms.converters[typeArg] === 'undefined') return ctx.error('Неизвестный тип времени')
      const id = findOfflinePlayer(nameArg, ctx)
      if (id) mute(typeArg, timeArg, reasonArg, id, ctx)
      return
    }

    selectPlayer(ctx.player, 'замутить').then(e => {
      new ModalForm('Мут ' + e.name)
        .addTextField('Время', 'введи', '5')
        .addDropdownFromObject('Тип времени', {
          min: 'Минуты',
          hour: 'Часы',
        })
        .addTextField('Причина', 'за поведение')
        .show(ctx.player, (formctx, timeRaw, type, reason) => {
          const time = parseInt(timeRaw)
          if (isNaN(time)) return formctx.error(`${timeRaw} это не число`)

          mute(type, time, reason || undefined, e.id, ctx)
        })
    })
  })

new Command('unmute')
  .setDescription('Вернуть обратно')
  .setPermissions('helper')
  .string('name', true)
  .executes((ctx, name) => {
    if (name) {
      const id = findOfflinePlayer(name, ctx)
      if (id) {
        if (!Chat.getInstance().muteDb.has(id)) return ctx.error('Не был замьючен')

        Chat.getInstance().muteDb.delete(id)
        return ctx.reply('Размьючен')
      }
      return
    }

    new ArrayForm('Муты', Chat.getInstance().muteDb.entries())
      .button(([id, info]) => {
        if (!info) return false
        const until = `До: ${new Date(info.mutedUntil).toYYYYMMDD()} ${new Date(info.mutedUntil).toHHMM()}`
        return [
          `${getFullname(id)} ${until}\n${info.reason}`,
          form((f, { self }) => {
            f.title(getFullname(id))
            f.body(`Причина: ${info.mutedUntil}\n${until}`)
            f.button('Размутить', () => {
              Chat.getInstance().muteDb.delete(id)
              self()
            })
          }).show,
        ]
      })
      .show(ctx.player)
  })
