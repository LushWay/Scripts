import { Player, world } from '@minecraft/server'
import { FormCallback, PLAYER_DB, ROLES, getRole, setRole, util } from 'lib.js'
import { CommandContext } from 'lib/Command/Context.js'
import { ArrayForm } from 'lib/Form/ArrayForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { WHO_CAN_CHANGE } from 'lib/roles.js'

const FULL_HIERARCHY = Object.keys(ROLES)

/**
 *
 * @param {Role} who
 * @param {Role} target
 */
function canChange(who, target, allowSame = false) {
  if (allowSame && who === target) return true
  if (who === 'creator') return true
  return FULL_HIERARCHY.indexOf(who) < FULL_HIERARCHY.indexOf(target)
}

const command = new Command({
  name: 'role',
  description: 'Показывает вашу роль',
  requires: () => true,
})

const restoreRole = command
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

command.executes(roleForm)

/**
 * @param {CommandContext} ctx
 */
function roleForm(ctx) {
  const prole = getRole(ctx.sender.id)
  if (!WHO_CAN_CHANGE.includes(prole))
    return ctx.sender.info(
      `Ваша роль: ${ROLES[prole]}${
        restoreRole.sys.meta.requires(ctx.sender) ? '\n\n§3Восстановить прошлую роль: §f.role restore' : ''
      }`
    )

  const players = world.getAllPlayers()

  new ArrayForm('Roles $page/$max', '§3Ваша роль: ' + ROLES[prole], Object.entries(PLAYER_DB).reverse(), {
    filters: {
      sort: {
        name: 'Сортировать по',
        value: [
          ['role', '§aролям'],
          ['join date', '§6дате входа'],
        ],
      },
    },
    sort(keys, filters) {
      if (filters.sort === 'role') {
        return keys
          .sort((a, b) => FULL_HIERARCHY.indexOf(a[1].role) - FULL_HIERARCHY.indexOf(b[1].role))
          .filter(key => key[0] !== ctx.sender.id)
      } else return keys
    },
    addCustomButtonBeforeArray(form) {
      const button = this.button([ctx.sender.id, ctx.sender.database], { sort: 'role' }, form)

      if (button) form.addButton('§3Сменить мою роль\n§7(Восстановить потом: §f.role restore§7)', null, button[2])
    },
    button([id, { role, name: dbname }], _, form) {
      const target = players.find(e => e.id === id) ?? id
      const name = typeof target === 'string' ? dbname ?? 'Без имени' : target.name

      return [
        `${name}§r§f - ${ROLES[role]} ${typeof target === 'string' ? '§c(offline)' : ''}${
          canChange(prole, role) ? '' : ' §4Не сменить'
        }`,
        null,
        () => {
          const self = ctx.sender.id === id
          if (!canChange(prole, role, self)) {
            return new FormCallback(form, ctx.sender).error(
              '§4У игрока §f' + name + '§4 роль выше или такая же как у вас, вы не можете ее сменить.'
            )
          }
          const filteredRoles = Object.fromEntries(
            Object.entriesStringKeys(ROLES)
              .filter(([key]) => canChange(prole, key, self))
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

              if (target instanceof Player) {
                if (notify && target instanceof Player)
                  target.info(
                    `Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
                      showName ? `§3 игроком §r${ctx.sender.name}` : ''
                    }${message ? `\n§r§3Причина: §r${message}` : ''}`
                  )

                ctx.sender.success(`Роль игрока ${target.name} сменена успешно`)
              } else ctx.sender.success('Роль сменена успешно')

              setRole(target, newrole)
              if (self) {
                ctx.sender.database.prevRole ??= role
              }
            })
        },
      ]
    },
  }).show(ctx.sender)
}
