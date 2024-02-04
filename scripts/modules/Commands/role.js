import { Player, world } from '@minecraft/server'
import { CommandContext } from 'lib/Command/Context.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { PLAYER_DB, ROLES, getRole, setRole, util } from 'smapi.js'

/** @type {Role[]} */
const HIERARCHY = ['creator', 'curator', 'techAdmin', 'chefAdmin', 'admin']
const FULL_HIERARCHY = util.dedupe([...HIERARCHY, ...Object.keys(ROLES)])

/**
 *
 * @param {Role} who
 * @param {Role} target
 */
function canChange(who, target) {
  if (who === 'creator') return true
  return FULL_HIERARCHY.indexOf(who) < FULL_HIERARCHY.indexOf(target)
}

const roleCommand = new Command({
  name: 'role',
  description: 'Показывает вашу роль',
})

const restoreRole = roleCommand
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
    ctx.sender.info(`Вы вернули роль §r${ROLES[prevRole]}`)
  })

roleCommand.executes(roleForm)

/**
 * @param {CommandContext} ctx
 */
function roleForm(ctx, sort = true) {
  const prole = getRole(ctx.sender.id)
  if (!HIERARCHY.includes(prole))
    return ctx.sender.info(
      `Ваша роль: ${ROLES[prole]}${
        restoreRole.sys.data.requires(ctx.sender) ? '\n\nВосстановить прошлую роль: §f-role restore' : ''
      }`
    )

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
            .reverse()
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
              player.info(
                `Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
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

  form.addButton(`§3Сортировка по: ${sort ? '§aролям' : '§6дате входа'}`, () => roleForm(ctx, !sort))

  const keys = Object.entries(PLAYER_DB)
  if (sort) keys.sort((a, b) => FULL_HIERARCHY.indexOf(a[1].role) - FULL_HIERARCHY.indexOf(b[1].role))
  else keys.reverse()

  const ids = keys.map(e => e[0]).filter(key => key !== ctx.sender.id)

  const players = world.getAllPlayers()
  for (const id of ids) {
    const player = players.find(e => e.id === id)
    const { text, fn } = callback(player ?? id)
    form.addButton(text, fn)
  }

  form.show(ctx.sender)
}
