import { Player, world } from '@minecraft/server'
import { FormCallback, ROLES, getRole, setRole } from 'lib'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { t } from 'lib/i18n/text'
import { WHO_CAN_CHANGE } from 'lib/roles'

const FULL_HIERARCHY = Object.keys(ROLES)

function canChange(who: Role, target: Role, allowSame = false) {
  if (allowSame && who === target) return true
  if (who === 'creator') return true

  return FULL_HIERARCHY.indexOf(who) < FULL_HIERARCHY.indexOf(target)
}

const command = new Command('role')
  .setDescription(t`Показывает вашу роль`)
  .setPermissions('everybody')
  .executes(ctx => roleMenu(ctx.player))

const restoreRole = command
  .overload('restore')
  .setDescription(t`Восстанавливает вашу роль`)
  .setPermissions(p => !!p.database.prevRole)
  .executes(ctx => {
    const prevRole = ctx.player.database.prevRole
    if (!prevRole) return

    setRole(ctx.player, prevRole)
    delete ctx.player.database.prevRole

    ctx.player.info(t`Вы вернули роль §r${ROLES[prevRole]}`)
  })

function roleMenu(player: Player) {
  const prole = getRole(player.id)
  if (!WHO_CAN_CHANGE.includes(prole))
    return player.info(
      t`Ваша роль: ${ROLES[prole]}${
        restoreRole.sys.requires(player) ? t`\n\n§3Восстановить прошлую роль: §f.role restore` : ''
      }`,
    )

  const players = world.getAllPlayers()

  new ArrayForm('Roles $page/$max', Player.database.entries().reverse())
    .description(t`§3Ваша роль: ${ROLES[prole]}`)
    .filters({
      sort: {
        name: t`Сортировать по`,
        value: [
          ['online', t`§bонлайну`],
          ['role', t`§aролям`],
          ['join date', t`§6дате входа`],
        ],
      },
    })
    .sort((keys, filters) => {
      if (filters.sort === 'role' || filters.sort === 'online') {
        const online = world.getAllPlayers().map(e => e.id)
        return keys
          .sort((a, b) => FULL_HIERARCHY.indexOf(a[1].role) - FULL_HIERARCHY.indexOf(b[1].role))
          .filter(key => (key[0] !== player.id && filters.sort === 'online' ? online.includes(key[0]) : true))
      } else return keys
    })
    .addCustomButtonBeforeArray(function (this, form, _, back) {
      const button = this.button?.([player.id, player.database], { sort: 'role' }, form, back)

      if (button)
        form.button(
          t`§3Сменить мою роль
§7(Восстановить потом: §f.role restore§7)`,
          button[1],
        )
    })
    .button(([id, { role, name: dbname }], _, form) => {
      const target = players.find(e => e.id === id) ?? id
      const name = typeof target === 'string' ? (dbname ?? t`Без имени`) : target.name

      return [
        `${name}§r§f - ${ROLES[role]} ${typeof target === 'string' ? '§c(offline)' : ''}${
          canChange(prole, role) ? '' : t` §4Не сменить`
        }`,
        () => {
          const self = player.id === id
          if (!canChange(prole, role, self)) {
            return new FormCallback(form, player).error(
              t`§4У игрока §f` + name + t`§4 роль выше или такая же как у вас, вы не можете ее сменить.`,
            )
          }
          const filteredRoles = Object.fromEntries(
            Object.entriesStringKeys(ROLES)
              .filter(([key]) => canChange(prole, key, self))
              .reverse()
              .map(([key]) => [key, `${role === key ? '> ' : ''}${ROLES[key]}`]),
          )
          new ModalForm(name)
            .addToggle(t`Уведомлять`, true)
            .addToggle(t`Показать Ваш ник в уведомлении`, true)
            .addDropdownFromObject(t`Роль`, filteredRoles, {
              defaultValueIndex: Object.keys(filteredRoles).findIndex(e => e === role),
            })
            .addTextField(t`Причина смены роли`, t`Например, "чел дурной, пол технограда снес"`)
            .show(player, (_, notify, showName, newrole, message) => {
              if (target instanceof Player) {
                if (notify && target instanceof Player)
                  target.info(
                    t`Ваша роль сменена c ${ROLES[role]} §3на ${ROLES[newrole]}${
                      showName ? t`§3 игроком §r${player.name}` : ''
                    }${message ? t`\n§r§3Причина: §r${message}` : ''}`,
                  )

                player.success(t`Роль игрока ${target.name} сменена успешно`)
              } else player.success(t`Роль сменена успешно`)

              setRole(target, newrole)
              if (self) {
                player.database.prevRole ??= role
              }
            })
        },
      ]
    })
    .show(player)
}
