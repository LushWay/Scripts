import { InputPermissionCategory, Player, system } from '@minecraft/server'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { selectPlayer } from 'lib/form/select-player'

new Command('freeze')
  .setDescription('Останавливает движение игрока до unfreeze')
  .setPermissions('helper')
  .string('playerName')
  .executes((ctx, name) => {
    if (name) {
      const player = Player.getByName(name)
      if (!player) return ctx.error('Player not found')

      system.delay(() => {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
        player.onScreenDisplay.setActionBar('§cВы были заморожены', ActionbarPriority.Highest)
      })
      return ctx.reply('Успешно')
    }
    selectPlayer(ctx.player, 'заморозить').then(({ player }) => {
      if (!player) return ctx.player.fail('Выберите онлайн игрока')

      player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
      player.onScreenDisplay.setActionBar('§cВы были заморожены', ActionbarPriority.Highest)
      ctx.player.success()
    })
  })

new Command('unfreeze')
  .setDescription('Возвращает движение игроку')
  .setPermissions('helper')

  .string('playerName')
  .executes((ctx, name) => {
    if (name) {
      const player = Player.getByName(name)
      if (!player) return ctx.error('Player not found')

      system.delay(() => {
        player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)
        player.onScreenDisplay.setActionBar('§aВы были разморожены', ActionbarPriority.Highest)
      })
      return ctx.reply('Успешно')
    }
    selectPlayer(ctx.player, 'заморозить').then(({ id }) => {
      const player = Player.getById(id)
      if (!player) return ctx.player.fail('Выберите онлайн игрока')

      player.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)
      player.onScreenDisplay.setActionBar('§aВы были разморожены', ActionbarPriority.Highest)
      ctx.player.success()
    })
  })
