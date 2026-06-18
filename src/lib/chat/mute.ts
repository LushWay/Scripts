import { Player } from '@minecraft/server'
import { CommandContext } from 'lib/command/context'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { form, NewFormCallback } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { getFullname } from 'lib/get-fullname'
import { i18n, noI18n } from 'lib/i18n/text'
import { ms, Time } from 'lib/utils/ms'
import { Chat } from './chat'

function mute(type: Time, time: number, reason = noI18n`за поведение`, id: string, muter: Player) {
  const actualTime = ms.from(type, time)
  const muteInfo: Chat.MuteInfo = { mutedUntil: Date.now() + actualTime, reason }
  Chat.getInstance().muteDb.set(id, muteInfo)
  const player = Player.getById(id)
  if (player) Chat.getInstance().informAboutMute(player, muteInfo)

  const timeText = i18n.time(actualTime)
  const muteText = i18n`Игрок ${player ? getFullname(player) : Player.nameOrUnknown(id)} был замьючен на ${timeText} по причине: ${reason}`
  muter.success(muteText)
  // if (!Command.isServer(muter)) adminNotify(`${getFullname(muter)}: ${muteText}`)
}

function unmute(id: string, muter: Player) {
  const info = Chat.getInstance().muteDb.getImmutable(id)
  if (!info) return muter.fail(i18n`Не был замьючен`)

  const onlinePlayer = Player.getById(id)
  const fullname = onlinePlayer ? getFullname(onlinePlayer) : Player.nameOrUnknown(id)
  const timeText = i18n.time(info.mutedUntil - Date.now())

  Chat.getInstance().muteDb.delete(id)

  const muteText = i18n`Размьючен игрок ${fullname} который был замьючен по причине ${info.reason}, до конца оставалось ${timeText}`
  muter.success(muteText)
  // if (!Command.isServer(muter)) adminNotify(`${getFullname(muter)}: ${muteText}`)
}

function findOfflinePlayer(nameArg: string, ctx: CommandContext) {
  for (const [id, data] of Player.database.entriesImmutable()) {
    if (data.name === nameArg) return id
  }
  ctx.error(i18n`Игрок ${nameArg} не найден`)
}

new Command('mute')
  .setDescription(i18n`Заглушить игрока в чате`)
  .setPermissions('helper')
  .string('name', true)
  .int('time', true)
  .array('timeType', ['min', 'hour', 'day', 'sec'], true)
  .string('reason', true)
  .executes((ctx, nameArg, timeArg = 5, typeArg = 'min', reasonArg) => {
    if (nameArg) {
      if (typeof ms.converters[typeArg] === 'undefined') return ctx.error(i18n`Неизвестный тип времени`)
      const id = findOfflinePlayer(nameArg, ctx)
      if (id) mute(typeArg, timeArg, reasonArg, id, ctx.player)
      return
    }

    selectForMute(ctx.player)
  })

new Command('unmute')
  .setDescription(i18n`Вернуть обратно`)
  .setPermissions('helper')
  .string('name', true)
  .executes((ctx, name) => {
    if (name) {
      const id = findOfflinePlayer(name, ctx)
      if (id) unmute(id, ctx.player)
      return
    }

    muteMenu(ctx.player)
  })

export function muteMenu(player: Player, back?: NewFormCallback) {
  new ArrayForm(noI18n`Муты`, Chat.getInstance().muteDb.entries())
    .back(back)
    .addCustomButtonBeforeArray(f => {
      f.button(noI18n`Замутить`, BUTTON['+'], selectForMute)
    })
    .button(([id, info]) => {
      if (!info) return false
      const until = noI18n`До: ${new Date(info.mutedUntil).toYYYYMMDD()} ${new Date(info.mutedUntil).toHHMM()}`
      return [
        `${getFullname(id)} ${until}\n${info.reason}`,
        form((f, { self }) => {
          f.title(getFullname(id))
          f.body(i18n`Причина: ${info.mutedUntil}\n${until}`)
          f.button(i18n`Размутить`, () => {
            unmute(id, player)
            self()
          })
        }).show,
      ]
    })
    .show(player)
}

muteMenu.size = () => Chat.getInstance().muteDb.size

function selectForMute(player: Player, back?: NewFormCallback) {
  selectPlayer(player, noI18n`замутить`, back).then(e => {
    new ModalForm(noI18n`Мут ` + e.name)
      .addTextField(noI18n`Время`, noI18n`введи`, '5')
      .addDropdownFromObject(noI18n`Тип времени`, {
        min: noI18n`Минуты`,
        hour: noI18n`Часы`,
      })
      .addTextField(noI18n`Причина`, noI18n`за поведение`)
      .show(player, (formctx, timeRaw, type, reason) => {
        const time = parseInt(timeRaw)
        if (isNaN(time)) return formctx.error(noI18n`${timeRaw} это не число`)

        mute(type, time, reason || undefined, e.id, player)
      })
  })
}
