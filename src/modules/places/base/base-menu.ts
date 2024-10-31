import { Player } from '@minecraft/server'
import { ActionForm, LockAction, Region, Vector, editRegionPermissions, manageRegionMembers } from 'lib'
import { t } from 'lib/text'
import { BaseRegion } from './region'

new Command('base').setDescription('Меню базы').executes(ctx => openBaseMenu(ctx.player))

export function openBaseMenu(
  player: Player,
  back?: VoidFunction,
  onFail: (message: string) => void = message => player.fail(message),
) {
  if (LockAction.locked(player)) return

  const base = BaseRegion.instances().find(r => r.getMemberRole(player))
  if (!base) return onFail('§cУ вас нет базы! Вступите в существующую или создайте свою.')

  baseMenu(player, base, back)
}

function baseMenu(player: Player, base: Region, back?: VoidFunction) {
  const isOwner = base.getMemberRole(player) === 'owner'
  const baseBack = () => baseMenu(player, base, back)
  const form = new ActionForm(
    'Меню базы',
    t`${isOwner ? t`Это ваша база.` : t`База игрока ${base.ownerName}`}\n\nКоординаты: ${base.area.center}\nРадиус: ${base.area.radius}`,
  )

  form
    .addButtonBack(back)
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
