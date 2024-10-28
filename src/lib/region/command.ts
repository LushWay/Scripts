import { Player, world } from '@minecraft/server'
import 'lib/command'
import { parseArguments, parseLocationArguments } from 'lib/command/utils'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { BUTTON, FormCallback } from 'lib/form/utils'
import { Region } from 'lib/region/kinds/region'
import { textTable } from 'lib/text'
import { inspect } from 'lib/util'
import { Vector } from 'lib/vector'
import { SphereArea } from './areas/sphere'

export const createableRegions: { name: string; region: typeof Region }[] = []
export function registerCreateableRegion(name: string, region: typeof Region) {
  createableRegions.push({ name, region })
}

new Command('region')
  .setPermissions('techAdmin')
  .setGroup('public')
  .executes(ctx => {
    regionForm(ctx.player)
  })

function regionForm(player: Player) {
  const reg = (region: Parameters<typeof regionList>[1]) => () => regionList(player, region)

  const form = new ActionForm(
    'Управление регионами',
    '§7Чтобы создать регион, перейдите в список определенных регионов',
  )

  const currentRegion = Region.nearestRegion(player.location, player.dimension.type)

  if (currentRegion)
    form.addButton(
      'Регион на ' + Vector.string(Vector.floor(currentRegion.area.center), true) + '§f\n' + currentRegion.name,
      () => editRegion(player, currentRegion, () => regionForm(player)),
    )

  for (const r of createableRegions) {
    form.addButton(r.name, reg(r.region))
  }
  form.show(player)
}

function regionList(player: Player, RegionType: typeof Region, back = () => regionForm(player)) {
  const form = new ActionForm('Список ' + RegionType.name)

  form.addButton(ActionForm.backText, back).addButton('Создать', BUTTON['+'], () => {
    const form = new ModalForm('Создать ' + RegionType.name)

    form
      .addTextField('Центр', '~~~', '~~~')
      .addSlider('Радиус', 1, 100, 1)
      .show(player, (ctx, rawCenter, radius) => {
        let center = parseLocationFromForm(ctx, rawCenter, player)
        if (!center) return
        center = Vector.floor(center)

        editRegion(player, RegionType.create(new SphereArea({ radius, center }, player.dimension.type)), () =>
          regionList(player, RegionType, back),
        )
      })
  })

  for (const region of RegionType.instances()) {
    form.addButton(region.name, () => editRegion(player, region, () => regionList(player, RegionType, back)))
  }
  form.show(player)
}

const pluralForms: WordPluralForms = ['региона', 'регион', 'в регионе']

function editRegion(player: Player, region: Region, back: () => void) {
  const selfback = () => editRegion(player, region, back)
  const form = new ActionForm(
    'Регион ' + region.name,
    textTable({
      'Тип региона': region.creator.name,
      'Центр': Vector.string(region.area.center, true),
      'Радиус': region.area instanceof SphereArea ? region.area.radius : 'не поддерживается',
    }),
  )
    .addButton(ActionForm.backText, back)
    .addButton('Участники', () =>
      manageRegionMembers(player, region, {
        isOwner: true,
        back: selfback,
        pluralForms,
      }),
    )
    .addButton('Разрешения', () =>
      editRegionPermissions(player, region, {
        pluralForms,
        back: selfback,
        extendedEditPermissions: true,
      }),
    )

  if (region.structure) {
    const color = region.structure.exists ? '' : '§7'
    form.addButton(`${color}Восстановить структуру`, () => region.structure?.place())
    form.addButton(`${color}Пересохранить структуру`, () => {
      region.structure?.delete()
      region.structure?.save()
    })
    form.addButtonPrompt('§cУдалить структуру', '§cУдалить', () => region.structure?.delete())
  }

  form.addButtonPrompt('§cУдалить регион', '§cУдалить', () => region.delete(), '§aНе удалять').show(player)
}

function parseLocationFromForm(ctx: FormCallback<ModalForm>, location: string, player: Player) {
  const [x, y, z] = parseArguments(location)
  if (!x || !y || !z) return ctx.error('Неправильные координаты: ' + inspect(location))

  const parsed = parseLocationArguments([x, y, z], player)
  if (!parsed) return ctx.error('Неправильная локация: ' + inspect(location))

  return parsed
}

export function editRegionPermissions(
  player: Player,
  region: Region,
  {
    pluralForms,
    back,
    extendedEditPermissions = false,
  }: { pluralForms: WordPluralForms; extendedEditPermissions?: boolean; back: () => void },
) {
  let form: ModalForm<
    (
      ctx: FormCallback,
      doors: boolean,
      switches: boolean,
      trapdoors: boolean,
      containers: boolean,
      fences: boolean,
      pvp?: 'true' | 'false' | 'pve',
      radius?: number,
      center?: string,
    ) => void
  > = new ModalForm('Разрешения ' + pluralForms[0])
    .addToggle(
      `Двери\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки использовать двери.`,
      region.permissions.doors,
    )
    .addToggle(
      `Рычаг и кнопки\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки использовать рычаг и кнопки.`,
      region.permissions.switches,
    )
    .addToggle(
      `Люки\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки использовать люки.`,
      region.permissions.trapdoors,
    )
    .addToggle(
      `Контейнеры\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки открывать контейнеры (сундуки, шалкеры и тд)`,
      region.permissions.openContainers,
    )
    .addToggle(
      `Калитки\n§7Определяет, смогут ли не добавленные в ${pluralForms[1]} игроки использовать калитки.`,
      region.permissions.gates,
    )

  if (extendedEditPermissions) {
    form = form.addDropdownFromObject(
      `Сражение\n§7Определяет, смогут ли игроки сражаться ${pluralForms[2]}`,
      {
        true: 'Да',
        pve: 'Только с сущностями (pve)',
        false: 'Нет',
      },
      { defaultValueIndex: String(region.permissions.pvp) },
    )

    if (region.area instanceof SphereArea)
      form
        .addSlider(`Радиус\n§7Определяет радиус ${pluralForms[0]}`, 1, 100, 1, region.area.radius)
        .addTextField('Центр региона', Vector.string(region.area.center), Vector.string(region.area.center))
  }
  form.show(player, (ctx, doors, switches, trapdoors, containers, fences, pvp, radiusOrCenter, rawCenter) => {
    region.permissions.doors = doors
    region.permissions.switches = switches
    region.permissions.trapdoors = trapdoors
    region.permissions.gates = fences
    region.permissions.openContainers = containers
    if (typeof pvp === 'string') region.permissions.pvp = pvp === 'false' ? false : pvp === 'true' ? true : 'pve'

    if (region.area instanceof SphereArea) {
      if (typeof radiusOrCenter === 'number') region.area.radius = radiusOrCenter
      if (rawCenter) {
        const center = parseLocationFromForm(ctx, rawCenter, player)
        if (center) region.area.center = center
      }
    }
    region.save()
    back()
  })
}

export function manageRegionMembers(
  player: Player,
  region: Region,
  {
    back,
    member = region.getMemberRole(player.id),
    isOwner = member === 'owner',
    pluralForms,
  }: {
    back: () => void
    pluralForms: WordPluralForms
    isOwner?: boolean
    member?: ReturnType<Region['getMemberRole']>
  },
) {
  const form = new ActionForm(
    'Участники ' + pluralForms[0],
    isOwner ? 'Для управления участником нажмите на кнопку с его ником' : 'Вы можете только посмотреть их',
  )

  const selfback = () =>
    manageRegionMembers(player, region, {
      back,
      member,
      isOwner,
      pluralForms,
    })

  const applyAction = () => {
    region.save()
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

      if (region.getMemberRole(memberId) !== 'owner')
        form.addButtonPrompt(
          isOwner ? `Передать права владельца ${pluralForms[0]}` : `Назначить владельцем ${pluralForms[0]}`,
          'Передать',
          () => {
            region.permissions.owners = region.permissions.owners.sort(a => (a === memberId ? 1 : -1))
            applyAction()
          },
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
