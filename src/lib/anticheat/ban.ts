import { system, world } from '@minecraft/server'

new Command('ban')
  .setDescription('Кикает и убирает игрока из вайтлиста')
  .setPermissions('helper')
  .string('playerName')
  .executes((ctx, name) => {
    system.delay(() => {
      world.overworld.runCommand(`allowlist remove ${name}`)
      world.overworld.runCommand(
        `kick ${name} "Вы были забанены\nОбжаловать можно через бот техподдержки: @FolkLore_Support_bot"`,
      )
    })
    ctx.player.success()
  })
