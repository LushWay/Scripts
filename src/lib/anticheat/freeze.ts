import { InputPermissionCategory, Player, system, world } from '@minecraft/server'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { ArrayForm } from 'lib/form/array'
import { NewFormCallback } from 'lib/form/new'
import { selectPlayer } from 'lib/form/select-player'
import { BUTTON } from 'lib/form/utils'
import { getFullname } from 'lib/get-fullname'
import { noI18n } from 'lib/i18n/text'

new Command('freeze')
  .setDescription(noI18n`Останавливает движение игрока до unfreeze`)
  .setPermissions('helper')
  .string('playerName')
  .executes((ctx, name) => {
    if (name) {
      const target = Player.getByName(name)
      if (!target) return ctx.error('Player not found')

      if (Command.isServer(ctx.player)) ctx.player.success()
      return system.delay(() => freeze(target, ctx.player))
    }

    selectForFreeze(ctx.player)
  })

new Command('unfreeze')
  .setDescription(noI18n`Возвращает движение игроку`)
  .setPermissions('helper')
  .string('playerName')
  .executes((ctx, name) => {
    if (name) {
      const target = Player.getByName(name)
      if (!target) return ctx.error('Player not found')

      if (Command.isServer(ctx.player)) ctx.player.success()
      return system.delay(() => unfreeze(target, ctx.player))
    }

    freezeMenu(ctx.player)
  })

export function freezeMenu(player: Player, back?: NewFormCallback) {
  const freezedPlayers = getFreezedPlayers()

  new ArrayForm(noI18n`Заморозка`, freezedPlayers)
    .back(back)
    .addCustomButtonBeforeArray(f => {
      f.button(noI18n`Заморозить`, BUTTON['+'], selectForFreeze)
    })
    .button(target => {
      return [getFullname(target), () => unfreeze(target, player)]
    })
    .show(player)
}

function getFreezedPlayers() {
  return world
    .getAllPlayers()
    .filter(e => !e.inputPermissions.isPermissionCategoryEnabled(InputPermissionCategory.Movement))
}

freezeMenu.size = () => getFreezedPlayers().length

function unfreeze(target: Player, freezer: Player) {
  target.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, true)
  target.onScreenDisplay.setActionBar(noI18n`§aВы были разморожены`, ActionbarPriority.Highest)
  const unfreezeText = noI18n`Игрок ${getFullname(target)} был разморожен`
  freezer.success(unfreezeText)
  // if (!Command.isServer(freezer)) adminNotify(`${getFullname(freezer)}: ${unfreezeText}`)
}

export function selectForFreeze(player: Player, back?: NewFormCallback) {
  selectPlayer(player, noI18n`заморозить`, back).then(({ player: target }) => {
    if (!target) return player.fail(noI18n`Выберите онлайн игрока`)

    freeze(target, player)
  })
}

function freeze(target: Player, freezer: Player) {
  target.inputPermissions.setPermissionCategory(InputPermissionCategory.Movement, false)
  target.onScreenDisplay.setActionBar(noI18n`§cВы были заморожены`, ActionbarPriority.Highest)
  const unfreezeText = noI18n`Игрок ${getFullname(target)} был заморожен`
  freezer.success(unfreezeText)
  // if (!Command.isServer(freezer)) adminNotify(`${getFullname(freezer)}: ${unfreezeText}`)
}
