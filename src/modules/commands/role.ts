import { Player, world } from '@minecraft/server'
import { FormCallback, ROLES, getRole, setRole } from 'lib'
import { ArrayForm } from 'lib/form/array'
import { ModalForm } from 'lib/form/modal'
import { i18n } from 'lib/i18n/text'
import { WHO_CAN_CHANGE } from 'lib/roles'

const FULL_HIERARCHY = Object.keys(ROLES)

function canChange(who: Role, target: Role, allowSame = false) {
  if (allowSame && who === target) return true
  if (who === 'creator') return true

  return FULL_HIERARCHY.indexOf(who) < FULL_HIERARCHY.indexOf(target)
}

const command = new Command('role')
  .setDescription(i18n`Показывает вашу роль`)
  .setPermissions('everybody')
  .executes(ctx => roleMenu(ctx.player))

const restoreRole = command
  .overload('restore')
  .setDescription(i18n`Восстанавливает вашу роль`)
  .setPermissions(p => !!p.database.prevRole)
  .executes(ctx => {
    const prevRole = ctx.player.database.prevRole
    if (!prevRole) return

    setRole(ctx.player, prevRole)
    delete ctx.player.database.prevRole

    ctx.player.info(i18n`Вы вернули роль §r${ROLES[prevRole]}`)
  })

function roleMenu(player: Player) {
  const prole = getRole(player.id)
  if (!WHO_CAN_CHANGE.includes(prole))
    return player.info(
      i18n`Ваша роль: ${ROLES[prole]}${
        restoreRole.sys.requires(player) ? i18n`\n\n§3Восстановить прошлую роль: §f.role restore` : ''
      }`,
    )

  // TODO Fix colors

  const players = world.getAllPlayers()

  new ArrayForm('Roles $page/$max', Player.database.entries().reverse())
    .description(i18n`§3Ваша роль: ${ROLES[prole]}`)
    .filters({
      sort: {
        name: i18n`Сортировать по`,
        value: [
          ['online', i18n`§bонлайну`],
          ['role', i18n`§aролям`],
          ['join date', i18n`§6дате входа`],
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
        form.button(i18n`§3Сменить мою роль\n§7(Восстановить потом: §f.role restore§7)`.to(player.lang), button[1])
    })
    .button(([id, { role, name: dbname }], _, form) => {
      const target = players.find(e => e.id === id) ?? id
      const name = typeof target === 'string' ? (dbname ?? i18n`Без имени`) : target.name

      return [
        i18n.nocolor.join`${name}§r§f - ${ROLES[role]} ${typeof target === 'string' ? '§c(offline)' : ''}${
          canChange(prole, role) ? '' : i18n.error` §4Не сменить`
        }`,
        () => {
          const self = player.id === id
          if (!canChange(prole, role, self)) {
            return new FormCallback(form, player).error(
              i18n.error`У игрока ${name} роль выше или такая же как у вас, вы не можете ее сменить.`.to(player.lang),
            )
          }
          const filteredRoles = Object.fromEntries(
            Object.entriesStringKeys(ROLES)
              .filter(([key]) => canChange(prole, key, self))
              .reverse()
              .map(([key]) => [key, `${role === key ? '> ' : ''}${ROLES[key].to(player.lang)}`]),
          )
          new ModalForm(name.to(player.lang))
            .addToggle(i18n`Уведомлять`.to(player.lang), true)
            .addToggle(i18n`Показать Ваш ник в уведомлении`.to(player.lang), true)
            .addDropdownFromObject(i18n`Роль`.to(player.lang), filteredRoles, {
              defaultValueIndex: Object.keys(filteredRoles).findIndex(e => e === role),
            })
            .addTextField(
              i18n`Причина смены роли`.to(player.lang),
              i18n`Например, "чел дурной, пол технограда снес"`.to(player.lang),
            )
            .show(player, (_, notify, showName, newrole, message) => {
              if (target instanceof Player) {
                if (notify && target instanceof Player)
                  target.info(
                    i18n.accent`Ваша роль сменена c ${ROLES[role]} на ${ROLES[newrole]}${
                      showName ? i18n.accent` игроком ${player.name}` : ''
                    }${message ? i18n.accent`\nПричина: ${message}` : ''}`,
                  )

                player.success(i18n`Роль игрока ${target.name} сменена успешно`)
              } else player.success(i18n`Роль сменена успешно`)

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
