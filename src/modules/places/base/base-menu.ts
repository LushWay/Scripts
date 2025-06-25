import { Vec, editRegionPermissions, manageRegionMembers } from 'lib'
import { form } from 'lib/form/new'
import { i18n, t, tm } from 'lib/i18n/text'
import { baseRottingButton } from './actions/rotting'
import { baseUpgradeButton } from './actions/upgrade'
import { BaseRegion } from './region'

export const baseMenu = form.withParams<{ base?: BaseRegion; message?: Text }>(
  (f, { player, back, params: { base = BaseRegion.getAll().find(r => r.getMemberRole(player)), message } }) => {
    f.title(i18n`Меню базы`)

    if (!base) {
      return f.body(i18n.error`У вас нет базы! Вступите в существующую или создайте свою.`)
    }

    const baseBack = (message?: Text) => baseMenu({ message, base }).show(player, back)
    const isOwner = base.getMemberRole(player) === 'owner'

    f.body(
      i18n`${message ? tm`${message}\n\n` : ''}${isOwner ? t`Это ваша база.` : t`База игрока ${base.ownerName}`}${t`\n\nКоординаты: ${base.area.center}\nРадиус: ${base.area.radius}`}`,
    )
      .button(t`Телепорт!`, () => player.teleport(Vec.add(base.area.center, { x: 0.5, y: 2, z: 0.5 })))
      .button(t`Участники${t.size(base.permissions.owners.length)}`, () =>
        manageRegionMembers(player, base, {
          back: baseBack,
        }),
      )
      .button(...baseRottingButton(base, player, baseBack))
      .button(...baseUpgradeButton(base, player, baseBack))

    if (isOwner)
      f.button(t`Разрешения`, () =>
        editRegionPermissions(player, base, {
          back: baseBack,
        }),
      )
  },
)

export const baseCommand = new Command('base').setDescription(t`Меню базы`).executes(baseMenu({}).command)
