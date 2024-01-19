import { Player, world } from '@minecraft/server'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { PLAYER_DB, ROLES, getRole, setRole, util } from 'smapi.js'

/** @type {Role[]} */
const HIERARCHY = ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin']
/**
 *
 * @param {Role} who
 * @param {Role} target
 */
function canChange(who, target) {
  return HIERARCHY.indexOf(who) < HIERARCHY.indexOf(target)
}

const roleCommand = new Command({
  name: 'role',
  description: 'Показывает вашу роль',
})
roleCommand
  .literal({
    description: 'Восстанавливает вашу роль',
    name: 'restore',
    requires: p => !!p.database.prevRole,
  })
  .executes(ctx => {
    const prevRole = ctx.sender.database.prevRole
    if (!prevRole) return

    setRole(ctx.sender, prevRole)
    delete ctx.sender.database.prevRole
    ctx.sender.tell(`§b> §3Вы вернули роль §r${ROLES[prevRole]}`)
  })

roleCommand.executes(ctx => {
  const prole = getRole(ctx.sender.id)
  if (!HIERARCHY.includes(prole)) return ctx.reply(`§b> §r${ROLES[prole]}`)

  /**
   * @param {Player | string} player
   */
  const callback = (player, fakeChange = false) => {
    const id = typeof player === 'string' ? player : player.id
    const role = getRole(id)
    const name = typeof player === 'string' ? Player.name(player) ?? 'Без имени' : player.name

    return {
      text: `${name}§r§f - ${ROLES[role]} ${typeof player === 'string' ? '§c(offline)' : ''}${
        canChange(prole, role) ? '' : ' §4Не сменить'
      }`,
      fn: () => {
        if (!canChange(prole, role)) {
          return ctx.error('§4У игрока §f' + name + '§4 роль выше или такая же как у вас, вы не можете ее сменить.')
        }
        const filteredRoles = Object.fromEntries(
          Object.entriesStringKeys(ROLES)
            .filter(([key]) => canChange(prole, key))
            .map(([key]) => [key, `${role === key ? '> ' : ''}${ROLES[key]}`])
        )
        new ModalForm(name)
          .addToggle('Уведомлять', true)
          .addToggle('Показать Ваш ник в уведомлении', true)
          .addDropdownFromObject('Роль', filteredRoles, {
            defaultValueIndex: Object.keys(filteredRoles).findIndex(e => e === role),
          })
          .addTextField('Причина смены роли', `Например, "чел дурной, пол технограда снес"`)
          .show(ctx.sender, (formCtx, notify, showName, newrole, message) => {
            if (!newrole)
              return formCtx.error('Неизвестная роль: ' + newrole + '§r, допустимые: ' + util.inspect(ROLES))
            if (notify && player instanceof Player)
              player.tell(
                `§b> §3Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
                  showName ? `§3 игроком §r${ctx.sender.name}` : ''
                }${message ? `\n§r§3Причина: §r${message}` : ''}`
              )
            setRole(id, newrole)
            if (fakeChange) {
              ctx.sender.database.prevRole = role
            }
          })
      },
    }
  }
  const form = new ActionForm('Roles', '§3Ваша роль: ' + ROLES[prole]).addButton(
    '§3Сменить мою роль\n§7(Восстановить потом: §f-role restore§7)',
    callback(ctx.sender, true).fn
  )

  const onlinePlayers = world.getPlayers().filter(e => e.id !== ctx.sender.id)
  const onlineIds = onlinePlayers.map(e => e.id)
  for (const player of onlinePlayers) {
    const { text, fn } = callback(player)
    form.addButton(text, fn)
  }

  for (const id of Object.keys(PLAYER_DB).filter(key => key !== ctx.sender.id && !onlineIds.includes(key))) {
    const { text, fn } = callback(id)
    form.addButton(text, fn)
  }

  form.show(ctx.sender)
})
