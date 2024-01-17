import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { PLAYER_DB, ROLES, getRole, setRole, util } from 'smapi.js'

const roleCommand = new Command({
  name: 'role',
  description: 'Показывает вашу роль',
})
roleCommand.executes(ctx => {
  const role = getRole(ctx.sender.id)
  const isAdmin = role === 'admin'
  const needAdmin = ctx.args[0] === 'ACCESS'
  const beenAdmin = PLAYER_DB[ctx.sender.id].roleSetter && !isAdmin

  if (ctx.sender.isOp() && needAdmin && beenAdmin) {
    PLAYER_DB[ctx.sender.id].role = 'admin'
    delete PLAYER_DB[ctx.sender.id].roleSetter
    return ctx.reply('§b> §3Вы получили роль §r' + ROLES.admin)
  }

  if (!isAdmin) return ctx.reply(`§b> §r${ROLES[role]}`)

  /**
   * @param {Player | string} player
   */
  const callback = (player, fakeChange = false) => {
    const id = typeof player === 'string' ? player : player.id
    return () => {
      const role = getRole(id)
      const ROLE = Object.fromEntries(
        Object.entriesStringKeys(ROLES).map(([key]) => [key, `${role === key ? '> ' : ''}${ROLES[key]}`])
      )
      new ModalForm(typeof player === 'string' ? Player.name(player) ?? 'Без имени' : player.name)
        .addToggle('Уведомлять', true)
        .addToggle('Показать Ваш ник в уведомлении', true)
        .addDropdownFromObject('Роль', ROLE, {
          defaultValueIndex: Object.keys(ROLE).findIndex(e => e === role),
        })
        .addTextField('Причина смены роли', `Например, "космокс"`)
        .show(ctx.sender, (formCtx, notify, showName, newrole, message) => {
          if (!newrole) return formCtx.error('Неизвестная роль: ' + newrole + '§r, допустимые: ' + util.inspect(ROLES))
          if (notify && player instanceof Player)
            player.tell(
              `§b> §3Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
                showName ? `§3 игроком §r${ctx.sender.name}` : ''
              }${message ? `\n§r§3Причина: §r${message}` : ''}`
            )
          setRole(id, newrole)
          if (fakeChange) {
            PLAYER_DB[id].roleSetter = 1
          }
        })
    }
  }
  const form = new ActionForm('Roles', '§3Ваша роль: ' + ROLES[role]).addButton(
    'Сменить мою роль',
    callback(ctx.sender, true)
  )

  const onlinePlayers = world.getPlayers().filter(e => e.id !== ctx.sender.id)
  for (const player of onlinePlayers) {
    form.addButton(player.name + ` (${ROLES[getRole(player.id)]})`, callback(player))
  }
  const onlineIds = onlinePlayers.map(e => e.id)

  for (const [id, player] of Object.entries(PLAYER_DB).filter(
    ([key]) => key !== ctx.sender.id && !onlineIds.includes(key)
  )) {
    form.addButton(`${player.name} (${ROLES[player.role]})`, callback(id))
  }
  form.show(ctx.sender)
})
