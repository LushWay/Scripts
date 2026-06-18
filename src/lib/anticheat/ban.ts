import { Player, system, world } from '@minecraft/server'
import { CommandContext } from 'lib/command/context'
import { NewFormCallback } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { noI18n } from 'lib/i18n/text'

new Command('ban')
  .setDescription(noI18n`Кикает и убирает игрока из вайтлиста`)
  .setPermissions('helper')
  .string('playerName', true)
  .executes((ctx, name) => {
    if (name) {
      if (!findOfflinePlayer(name, ctx)) return

      system.delay(() => ban(name, ctx.player))
      if (Command.isServer(ctx.player)) ctx.player.success()
    }
  })

function ban(name: string, admin: Player) {
  world.overworld.runCommand(`allowlist remove ${name}`)
  world.overworld.runCommand(
    noI18n.nocolor`kick ${name} "Вы были забанены\nОбжаловать можно через бот техподдержки: @FolkLore_Support_bot"`,
  )

  if (!Command.isServer(admin)) {
    const text = noI18n`Игрок ${name} был забанен`
    admin.success(text)
    // adminNotify(`${getFullname(admin)}: ${text}`)
  }
}

export function banMenu(player: Player, back?: NewFormCallback) {
  selectPlayer(player, noI18n`забанить`, back).then(({ name }) => {
    ban(name, player)
  })
}

function findOfflinePlayer(nameArg: string, ctx: CommandContext) {
  for (const [id, data] of Player.database.entriesImmutable()) {
    if (data.name === nameArg) return id
  }
  ctx.error(noI18n`Игрок ${nameArg} не найден`)
}
