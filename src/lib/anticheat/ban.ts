import { Player, system, world } from '@minecraft/server'
import { CommandContext } from 'lib/command/context'
import { NewFormCallback } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'

new Command('ban')
  .setDescription('Кикает и убирает игрока из вайтлиста')
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
    `kick ${name} "Вы были забанены\nОбжаловать можно через бот техподдержки: @FolkLore_Support_bot"`,
  )

  if (!Command.isServer(admin)) {
    const text = `Игрок ${name} был забанен`
    admin.success(text)
    // adminNotify(`${getFullname(admin)}: ${text}`)
  }
}

export function banMenu(player: Player, back?: NewFormCallback) {
  selectPlayer(player, 'забанить', back).then(({ name }) => {
    ban(name, player)
  })
}

function findOfflinePlayer(nameArg: string, ctx: CommandContext) {
  for (const [id, data] of Player.database.entriesImmutable()) {
    if (data.name === nameArg) return id
  }
  ctx.error(`Игрок ${nameArg} не найден`)
}
