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
  const noAdmins = !Object.values(PLAYER_DB)
    .map(e => e.role)
    .includes('admin')
  const isAdmin = role === 'admin'
  const needAdmin = ctx.args[0] === 'ACCESS'
  const beenAdmin = PLAYER_DB[ctx.sender.id].roleSetter && !isAdmin

  if (noAdmins && ctx.sender.isOp() && (needAdmin || beenAdmin)) {
    PLAYER_DB[ctx.sender.id].role = 'admin'
    delete PLAYER_DB[ctx.sender.id].roleSetter
    return ctx.reply('§b> §3Вы получили роль §r' + ROLES.admin)
  }

  if (!isAdmin) return ctx.reply(`§b> §r${ROLES[role]}`)

  /**
   * @param {Player} player
   */
  const callback = (player, fakeChange = false) => {
    return () => {
      const role = getRole(player.id)
      const ROLE = Object.fromEntries(
        Object.entriesStringKeys(ROLES).map(([key]) => [
          key,
          `${role === key ? '> ' : ''}${ROLES[key]}`,
        ])
      )
      new ModalForm(player.name)
        .addToggle('Уведомлять', false)
        .addToggle('Показать Ваш ник в уведомлении', false)
        .addDropdownFromObject('Роль', ROLE, {
          defaultValueIndex: Object.keys(ROLE).findIndex(e => e === role),
        })
        .addTextField('Причина смены роли', `Например, "космокс"`)
        .show(ctx.sender, (formCtx, notify, showName, newrole, message) => {
          if (!newrole)
            return formCtx.error(
              'Неизвестная роль: ' +
                newrole +
                '§r, допустимые: ' +
                util.inspect(ROLES)
            )
          if (notify)
            player.tell(
              `§b> §3Ваша роль сменена c ${ROLES[role]} §3на ${newrole}${
                showName ? `§3 игроком §r${ctx.sender.name}` : ''
              }${message ? `\n§r§3Причина: §r${message}` : ''}`
            )
          setRole(player.id, newrole)
          if (fakeChange) {
            PLAYER_DB[player.id].role = newrole
            PLAYER_DB[player.id].roleSetter = 1
          }
        })
    }
  }
  const form = new ActionForm('Roles', '§3Ваша роль: ' + ROLES[role]).addButton(
    'Сменить мою роль',
    callback(ctx.sender, true)
  )

  for (const player of world.getPlayers({ excludeNames: [ctx.sender.name] }))
    form.addButton(player.name, callback(player))

  form.show(ctx.sender)
})
