import { Player } from '@minecraft/server'
import {
  ActionForm,
  BaseRegion,
  LockAction,
  RadiusRegion,
  Region,
  Vector,
  editRegionPermissions,
  manageRegionMembers,
} from 'lib'

export function openBaseMenu(
  player: Player,
  back?: VoidFunction,
  onFail: (message: string) => void = message => player.fail(message),
) {
  if (LockAction.locked(player)) return

  const base = Region.regionInstancesOf(BaseRegion).find(r => r.getMemberRole(player))

  if (!base) return onFail('§cУ вас нет базы! Вступите в существующую или создайте свою.')

  baseMenu(player, base, back)
}

function baseMenu(player: Player, base: RadiusRegion, back?: VoidFunction) {
  const isOwner = base.getMemberRole(player) === 'owner'
  const baseBack = () => baseMenu(player, base, back)
  const form = new ActionForm(
    'Меню базы',
    `${isOwner ? 'Это ваша база.' : 'База игрока ' + base.ownerName}\n\nКоординаты: ${Vector.string(base.center, true)}`,
  )

  if (back) form.addButtonBack(back)

  form
    .addButton('Телепорт!', () => player.teleport(Vector.add(base.center, { x: 0.5, y: 2, z: 0.5 })))
    .addButton(`Участники§7 (${base.permissions.owners.length})`, () =>
      manageRegionMembers(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      }),
    )

  if (isOwner)
    form.addButton('Разрешения', () =>
      editRegionPermissions(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      }),
    )

  form.show(player)
}

const basePluralForms: WordPluralForms = ['базы', 'базу', 'на базе']
