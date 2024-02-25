import { Player, Vector } from '@minecraft/server'
import {
  ActionForm,
  BaseRegion,
  LockAction,
  RadiusRegion,
  Region,
  editRegionPermissions,
  manageRegionMembers,
} from 'lib.js'

/**
 * @param {Player} player
 * @param {VoidFunction} [back]
 */
export function openBaseMenu(player, back) {
  if (LockAction.locked(player)) return
  const base = Region.regionInstancesOf(BaseRegion).find(r => r.regionMember(player))

  if (!base) return player.fail('§cУ вас нет базы! Вступите в существующую или создайте свою.')

  baseMenu(player, base, back)
}

/**
 * @param {Player} player
 * @param {RadiusRegion} base
 * @param {VoidFunction} [back]
 */
function baseMenu(player, base, back) {
  const isOwner = base.regionMember(player) === 'owner'
  const baseBack = () => baseMenu(player, base, back)
  const form = new ActionForm(
    'Меню базы',
    `${isOwner ? 'Это ваша база.' : 'База игрока ' + base.ownerName}\n\nКоординаты: ${Vector.string(base.center, true)}`
  )

  if (back) form.addButtonBack(back)

  form
    .addButton('Телепорт!', () => player.teleport(Vector.add(base.center, { x: 0.5, y: 2, z: 0.5 })))
    .addButton(`Участники§7 (${base.permissions.owners.length})`, () =>
      manageRegionMembers(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      })
    )

  if (isOwner)
    form.addButton('Разрешения', () =>
      editRegionPermissions(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      })
    )

  form.show(player)
}

/** @type {WordPluralForms} */
const basePluralForms = ['базы', 'базу', 'на базе']
