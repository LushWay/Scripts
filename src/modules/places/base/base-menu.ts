import { Player } from '@minecraft/server'
import { ActionForm, LockAction, Region, Vector, editRegionPermissions, manageRegionMembers } from 'lib'
import { BaseRegion } from './region'

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

function baseMenu(player: Player, base: Region, back?: VoidFunction) {
  const isOwner = base.getMemberRole(player) === 'owner'
  const baseBack = () => baseMenu(player, base, back)
  const form = new ActionForm(
    'Меню базы',
    `${isOwner ? 'Это ваша база.' : `База игрока ${base.ownerName}`}\n\nКоординаты: ${Vector.string(base.area.center, true)}`,
  )

  if (back) form.addButtonBack(back)

  form
    .addButton('Телепорт!', () => player.teleport(Vector.add(base.area.center, { x: 0.5, y: 2, z: 0.5 })))
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
