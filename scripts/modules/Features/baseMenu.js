import { Player, Vector } from '@minecraft/server'
import { ActionForm, RadiusRegion, editRegionPermissions, manageRegionMembers } from 'lib.js'

/**
 * @param {Player} player
 * @param {RadiusRegion} base
 */
export function baseMenu(player, base) {
  const isOwner = base.regionMember(player) === 'owner'
  const selfback = () => baseMenu(player, base)
  const form = new ActionForm(
    'Меню базы',
    `${isOwner ? 'Это ваша база.' : 'База игрока ' + base.ownerName}\n\nКоординаты: ${Vector.string(base.center)}`
  )
    .addButton('Телепорт!', () => player.teleport(Vector.add(base.center, { x: 0.5, y: 2, z: 0.5 })))
    .addButton('Участники', () =>
      manageRegionMembers(player, base, {
        back: selfback,
        pluralForms: basePluralForms,
      })
    )

  if (isOwner)
    form.addButton('Разрешения', () =>
      editRegionPermissions(player, base, {
        back: selfback,
        pluralForms: basePluralForms,
      })
    )

  form.show(player)
}

/** @type {WordPluralForms} */
const basePluralForms = ['базы', 'базу', 'на базе']
