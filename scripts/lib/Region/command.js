import { Player, Vector, world } from '@minecraft/server'
import { parseArguments, parseLocationArguments } from 'lib/Command/utils.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { prompt } from 'lib/Form/MessageForm.js'
import { ModalForm } from 'lib/Form/ModalForm.js'
import { BUTTON, FormCallback } from 'lib/Form/utils.js'
import { CubeRegion } from 'lib/Region/Class/CubeRegion.js'
import { Region } from 'lib/Region/Class/Region.js'
import { REGION_DB } from 'lib/Region/DB.js'
import { util } from 'lib/util.js'
import { BaseRegion, MineshaftRegion, RadiusRegion, SafeAreaRegion } from './Class/RadiusRegion.js'

new Command({
  name: 'region',
  role: 'admin',
  type: 'server',
}).executes(ctx => {
  regionForm(ctx.sender)
})

/**
 * @typedef {CubeRegion | RadiusRegion} AnyRegion
 */

/**
 * @param {Player} player
 */
function regionForm(player) {
  const reg = (/** @type {Parameters<typeof regionList>[1]} */ region) => () => regionList(player, region)

  const form = new ActionForm(
    'Управление регионами',
    '§7Чтобы создать регион, перейдите в список определенных регионов'
  )

  const currentRegion = Region.locationInRegion(player.location, player.dimension.type)

  if (currentRegion instanceof RadiusRegion) {
    form.addButton('Регион на ' + Vector.string(currentRegion.center) + '\n' + currentRegion.name, () => {
      editRegion(player, currentRegion, () => regionForm(player))
    })
  }

  form
    .addButton('Базы', reg(BaseRegion))
    .addButton('Шахты', reg(MineshaftRegion))
    .addButton('Мирные зоны', reg(SafeAreaRegion))
    .show(player)
}

/**
 * @param {Player} player
 * @param {typeof RadiusRegion } RegionType
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function regionList(player, RegionType, back = () => regionForm(player)) {
  const form = new ActionForm('Список ' + RegionType.name)
  form.addButton(ActionForm.backText, back).addButton('Создать', BUTTON['+'], () => {
    const form = new ModalForm('Создать ' + RegionType.name)

    form
      .addTextField('Центр', '~~~', '~~~')
      .addSlider('Радиус', 1, 100, 1)
      .show(player, (ctx, rawCenter, radius) => {
        const center = parseLocationFromForm(ctx, rawCenter, player)
        if (!center) return

        editRegion(
          player,
          new RegionType({
            center,
            radius,
            dimensionId: player.dimension.type,
          }),
          () => regionList(player, RegionType, back)
        )
      })
  })

  for (const region of Region.regionInstancesOf(RegionType)) {
    form.addButton(region.name, () => editRegion(player, region, () => regionList(player, RegionType, back)))
  }
  form.show(player)
}

/**
 * @type {WordPluralForms}
 */
const pluralForms = ['региона', 'регион', 'в регионе']

/**
 * @param {Player} player
 * @param {RadiusRegion} region
 * @param {() => void} back
 * @returns {Promise<void>}
 */
function editRegion(player, region, back) {
  const selfback = () => editRegion(player, region, back)
  return new ActionForm('Регион ' + region.name)
    .addButton(ActionForm.backText, back)
    .addButton('Участники', () =>
      manageRegionMembers(player, region, {
        isOwner: true,
        back: selfback,
        pluralForms,
      })
    )
    .addButton('Разрешения', () =>
      editRegionPermissions(player, region, {
        pluralForms,
        back: selfback,
        extendedEditPermissions: true,
      })
    )
    .addButton('§cУдалить регион', () =>
      prompt(player, '§cТочно удалить регион?', '§cДА', () => delete REGION_DB[region.key], '§aНе удалять', selfback)
    )
    .show(player)
}

/**
 * @param {FormCallback<ModalForm>} ctx
 * @param {string} location
 * @param {Player} player
 */
function parseLocationFromForm(ctx, location, player) {
  const [x, y, z] = parseArguments(location, '')
  if (!x || !y || !z) return ctx.error('Неправильные координаты: ' + util.inspect(location))

  const parsed = parseLocationArguments([x, y, z], player)
  if (!parsed) return ctx.error('Неправильная локация: ' + util.inspect(location))

  return parsed
}
/**
 * @param {Player} player
 * @param {RadiusRegion} region
 * @param {object} param2
 * @param {WordPluralForms} param2.pluralForms
 * @param {boolean} [param2.extendedEditPermissions]
 * @param {() => void} param2.back
 */

export function editRegionPermissions(player, region, { pluralForms, back, extendedEditPermissions = false }) {
  /** @type {ModalForm<(ctx: FormCallback<any>, toggles: boolean, containers: boolean, pvp?: boolean, radius?: number, center?: string) => void>} */
  let form = new ModalForm('Разрешения ' + pluralForms[0])
    .addToggle(
      `Двери и переключатели\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки использовать двери и переключатели.`,
      region.permissions.doorsAndSwitches
    )
    .addToggle(
      `Контейнеры\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки открывать контейнеры (сундуки, шалкеры и тд)`,
      region.permissions.openContainers
    )

  if (extendedEditPermissions) {
    form = form
      .addToggle(`PVP\n§7Определяет, смогут ли игроки сражаться ${pluralForms[2]}`, region.permissions.pvp)
      .addSlider(`Радиус\n§7Определяет радиус ${pluralForms[0]}`, 1, 100, 1, region.radius)
      .addTextField('Центр региона', Vector.string(region.center), Vector.string(region.center))
  }
  form.show(player, (ctx, doors, containers, pvp, radius, rawCenter) => {
    region.permissions.doorsAndSwitches = doors
    region.permissions.openContainers = containers
    if (typeof pvp !== 'undefined') region.permissions.pvp = pvp
    if (typeof radius !== 'undefined') region.radius = radius
    if (rawCenter) {
      const center = parseLocationFromForm(ctx, rawCenter, player)
      if (center) region.center = center
    }
    region.update()
    back()
  })
}
/**
 * @param {Player} player
 * @param {RadiusRegion} region
 * @param {object} o
 * @param {() => void} o.back
 * @param {WordPluralForms} o.pluralForms
 * @param {boolean} [o.isOwner]
 * @param {ReturnType<Region['regionMember']>} [o.member]
 */

export function manageRegionMembers(
  player,
  region,
  { back, member = region.regionMember(player.id), isOwner = member === 'owner', pluralForms }
) {
  const form = new ActionForm(
    'Участники ' + pluralForms[0],
    isOwner ? 'Для управления участником нажмите на кнопку с его ником' : 'Вы можете только посмотреть их'
  )

  const selfback = () =>
    manageRegionMembers(player, region, {
      back,
      member,
      isOwner,
      pluralForms,
    })

  const applyAction = () => {
    region.update()
    selfback()
  }

  form.addButtonBack(back)

  if (isOwner)
    form.addButton('§3Добавить!', BUTTON['+'], () => {
      const form = new ActionForm('Добавить участника ' + pluralForms[2])
      for (const player of world.getAllPlayers())
        form.addButton(player.name, () => {
          region.permissions.owners.push(player.id)
          applyAction()
        })
      form.show(player)
    })
  for (const [i, memberId] of region.permissions.owners.entries()) {
    const name = Player.name(memberId) ?? '§7<Имя неизвестно>'
    form.addButton(`${i === 0 ? '§7Владелец > §f' : ''}${name}`, () => {
      const form = new ActionForm(name, `Управление участником ${pluralForms[0]}`).addButtonBack(selfback)

      if (region.regionMember(memberId) !== 'owner')
        form.addButtonPrompt(
          isOwner ? `Передать права владельца ${pluralForms[0]}` : `Назначить владельцем ${pluralForms[0]}`,
          'Передать',
          () => {
            region.permissions.owners = region.permissions.owners.sort(a => (a === memberId ? 1 : -1))
            applyAction()
          }
        )

      form
        .addButtonPrompt('§cУдалить участника', '§cУдалить', () => {
          region.permissions.owners = region.permissions.owners.filter(e => e !== memberId)
          applyAction()
        })
        .show(player)
    })
  }

  form.show(player)
}
