import { Player, world } from '@minecraft/server'
import { FormCallback, ROLES, getRole, setRole, util } from 'lib'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { WHO_CAN_CHANGE } from 'lib/roles'

const FULL_HIERARCHY = Object.keys(ROLES)

/**
 * @param {Role} who
 * @param {Role} target
 */
function canChange(who, target, allowSame = false) {
  if (allowSame && who === target) return true
  if (who === 'creator') return true

  return FULL_HIERARCHY.indexOf(who) < FULL_HIERARCHY.indexOf(target)
}

// @ts-expect-error TS(2552) FIXME: Cannot find name 'Command'. Did you mean 'command'... Remove this comment to see the full error message
const command = new Command('role')
  .setDescription('Показывает вашу роль')
  .setPermissions('everybody')
  .executes(ctx => roleMenu(ctx.player))

const restoreRole = command
  .overload('restore')
  .setDescription('Восстанавливает вашу роль')
  .setPermissions(p => !!p.database.prevRole)
  .executes(ctx => {
    const prevRole = ctx.player.database.prevRole
    if (!prevRole) return

    setRole(ctx.player, prevRole)
    delete ctx.player.database.prevRole

    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    ctx.player.info(`Вы вернули роль §r${ROLES[prevRole]}`)
  })

/** @param {Player} player */
function roleMenu(player) {
  const prole = getRole(player.id)
  if (!WHO_CAN_CHANGE.includes(prole))
    return player.info(
      // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      `Ваша роль: ${ROLES[prole]}${
        restoreRole.sys.requires(player) ? '\n\n§3Восстановить прошлую роль: §f.role restore' : ''
      }`,
    )

  const players = world.getAllPlayers()

  new ArrayForm('Roles $page/$max', '§3Ваша роль: ' + ROLES[prole], Object.entries(Player.database).reverse(), {
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
          .filter(key => key[0] !== player.id)
      } else return keys
    },

    addCustomButtonBeforeArray(form) {
      const button = this.button([player.id, player.database], { sort: 'role' }, form)

      if (button) form.addButton('§3Сменить мою роль\n§7(Восстановить потом: §f.role restore§7)', null, button[2])
    },

    button(
      [
        // @ts-expect-error TS(7031) FIXME: Binding element 'id' implicitly has an 'any' type.
        id,
        {
          // @ts-expect-error TS(7031) FIXME: Binding element 'role' implicitly has an 'any' typ... Remove this comment to see the full error message
          role,

          // @ts-expect-error TS(7031) FIXME: Binding element 'dbname' implicitly has an 'any' t... Remove this comment to see the full error message
          name: dbname,
        },
      ],
      _,
      form,
    ) {
      const target = players.find(e => e.id === id) ?? id
      const name = typeof target === 'string' ? dbname ?? 'Без имени' : target.name

      return [
        // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        `${name}§r§f - ${ROLES[role]} ${typeof target === 'string' ? '§c(offline)' : ''}${
          canChange(prole, role) ? '' : ' §4Не сменить'
        }`,
        null,
        () => {
          const self = player.id === id
          if (!canChange(prole, role, self)) {
            return new FormCallback(form, player).error(
              '§4У игрока §f' + name + '§4 роль выше или такая же как у вас, вы не можете ее сменить.',
            )
          }
          const filteredRoles = Object.fromEntries(
            Object.entriesStringKeys(ROLES)
              .filter(([key]) => canChange(prole, key, self))
              .reverse()
              .map(([key]) => [key, `${role === key ? '> ' : ''}${ROLES[key]}`]),
          )
          new ModalForm(name)
            .addToggle('Уведомлять', true)
            .addToggle('Показать Ваш ник в уведомлении', true)
            .addDropdownFromObject('Роль', filteredRoles, {
              defaultValueIndex: Object.keys(filteredRoles).findIndex(e => e === role),
            })
            // @ts-expect-error TS(2554) FIXME: Expected 3 arguments, but got 2.
            .addTextField('Причина смены роли', `Например, "чел дурной, пол технограда снес"`)
            .show(player, (formCtx, notify, showName, newrole, message) => {
              if (!newrole)
                return formCtx.error('Неизвестная роль: ' + newrole + '§r, допустимые: ' + util.inspect(ROLES))

              if (target instanceof Player) {
                if (notify && target instanceof Player)
                  target.info(
                    // @ts-expect-error TS(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    `Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
                      showName ? `§3 игроком §r${player.name}` : ''
                    }${message ? `\n§r§3Причина: §r${message}` : ''}`,
                  )

                player.success(`Роль игрока ${target.name} сменена успешно`)
              } else player.success('Роль сменена успешно')

              setRole(target, newrole)
              if (self) {
                player.database.prevRole ??= role
              }
            })
        },
      ]
    },
  }).show(player)
}
