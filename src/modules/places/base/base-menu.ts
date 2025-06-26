import { Vec, editRegionPermissions, manageRegionMembers } from 'lib'
import { form } from 'lib/form/new'
import { i18n } from 'lib/i18n/text'
import { baseRottingButton } from './actions/rotting'
import { baseUpgradeButton } from './actions/upgrade'
import { BaseRegion } from './region'

export const baseMenu = form.params<{ base?: BaseRegion; message?: Text }>(
  (f, { player, back, params: { base = BaseRegion.getAll().find(r => r.getMemberRole(player)), message } }) => {
    f.title(i18n`Меню базы`)

    if (!base) {
      return f.body(i18n.error`У вас нет базы! Вступите в существующую или создайте свою.`)
    }

    const baseBack = (message?: Text) => baseMenu({ message, base }).show(player, back)
    const isOwner = base.getMemberRole(player) === 'owner'

    f.body(
      i18n`${message ? i18n.join`${message}\n\n` : ''}${isOwner ? i18n`Это ваша база.` : i18n`База игрока ${base.ownerName}`}${i18n`\n\nКоординаты: ${base.area.center}\nРадиус: ${base.area.radius}`}`,
    )
      .button(i18n`Телепорт!`, () => player.teleport(Vec.add(base.area.center, { x: 0.5, y: 2, z: 0.5 })))
      .button(i18n`Участники`.size(base.permissions.owners.length), manageRegionMembers({ region: base }))
      .button(...baseRottingButton(base, player, baseBack))
      .button(...baseUpgradeButton(base, player, baseBack))

    if (isOwner) f.button(i18n`Разрешения`, () => editRegionPermissions(player, base, { back: baseBack }))
  },
)

export const baseCommand = new Command('base').setDescription(i18n`Меню базы`).executes(baseMenu({}).command)
