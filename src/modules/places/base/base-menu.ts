import { Player } from '@minecraft/server'
import { ActionForm, Vec, editRegionPermissions, manageRegionMembers } from 'lib'
import { MaybeRawText, t } from 'lib/text'
import { baseRottingButton } from './actions/rotting'
import { baseUpgradeButton } from './actions/upgrade'
import { BaseRegion } from './region'

export const baseCommand = new Command('base').setDescription(t`Меню базы`).executes(ctx => openBaseMenu(ctx.player))

export function openBaseMenu(
  player: Player,
  back?: VoidFunction,
  onFail: (message: string) => void = message => player.fail(message),
) {
  const base = BaseRegion.getAll().find(r => r.getMemberRole(player))
  if (!base) return onFail(t.error`У вас нет базы! Вступите в существующую или создайте свою.`)

  baseMenu(player, base, back)
}

function baseMenu(player: Player, base: BaseRegion, back?: VoidFunction, message?: MaybeRawText) {
  const isOwner = base.getMemberRole(player) === 'owner'
  const baseBack = (message?: MaybeRawText) => baseMenu(player, base, back, message)
  const form = new ActionForm(
    t`Меню базы`,
    t.raw`${message ? t.raw`${message}\n\n` : ''}${isOwner ? t`Это ваша база.` : t`База игрока ${base.ownerName}`}${t`\n\nКоординаты: ${base.area.center}\nРадиус: ${base.area.radius}`}`,
  )

  form
    .addButtonBack(back)
    .addButton(t`Телепорт!`, () => player.teleport(Vec.add(base.area.center, { x: 0.5, y: 2, z: 0.5 })))
    .addButton(t`Участники${t.size(base.permissions.owners.length)}`, () =>
      manageRegionMembers(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      }),
    )
    .addButton(...baseRottingButton(base, player, baseBack))
    .addButton(...baseUpgradeButton(base, player, baseBack))

  if (isOwner)
    form.addButton(t`Разрешения`, () =>
      editRegionPermissions(player, base, {
        back: baseBack,
        pluralForms: basePluralForms,
      }),
    )

  form.show(player)
}

const basePluralForms: WordPluralForms = [t`базы`, t`базу`, t`на базе`]
