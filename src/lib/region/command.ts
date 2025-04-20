import { LocationInUnloadedChunkError, MolangVariableMap, Player, system, world } from '@minecraft/server'
import 'lib/command'
import { parseArguments, parseLocationArguments } from 'lib/command/utils'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { BUTTON, FormCallback } from 'lib/form/utils'
import { Region } from 'lib/region/kinds/region'
import { t, textTable } from 'lib/text'
import { inspect } from 'lib/util'
import { Vector } from 'lib/vector'
import { RectangleArea } from './areas/rectangle'
import { SphereArea } from './areas/sphere'

export const createableRegions: { name: string; region: typeof Region }[] = []
export function registerCreateableRegion(name: string, region: typeof Region) {
  createableRegions.push({ name, region })
}

const command = new Command('region')
  .setPermissions('techAdmin')
  .setGroup('public')
  .executes(ctx => {
    regionForm(ctx.player)
  })

let regionBorders = false

command
  .overload('borders')
  .executes(ctx => ctx.player.tell(t`Borders enabled: ${regionBorders}`))
  .boolean('set', true)
  .executes((ctx, newValue = false) => {
    ctx.player.tell(t`${regionBorders} -> ${newValue}`)
    regionBorders = newValue
  })

const variables = new MolangVariableMap()
variables.setColorRGBA('color', {
  red: 0,
  green: 1,
  blue: 0,
  alpha: 0,
})

system.runInterval(
  () => {
    if (!regionBorders) return
    const players = world.getAllPlayers()

    for (const region of Region.regions) {
      if (!(region.area instanceof SphereArea)) continue
      if (!players.some(e => region.area.isNear(e, 30))) continue

      region.area.forEachVector((vector, isIn, dimension) => {
        try {
          const r = Vector.distance(region.area.center, vector)
          if (isIn && r > region.area.radius - 1) dimension.spawnParticle('minecraft:wax_particle', vector, variables)
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) return
          throw e
        }
      })
    }
  },
  'region borders',
  40,
)

function regionForm(player: Player) {
  const reg = (region: Parameters<typeof regionList>[1]) => () => regionList(player, region)

  const form = new ActionForm(
    'Управление регионами',
    '§7Чтобы создать регион, перейдите в список определенных регионов',
  )

  const currentRegion = Region.getAt(player)

  if (currentRegion)
    form.addButton(
      `Регион на ${Vector.string(Vector.floor(currentRegion.area.center), true)}§f\n${currentRegion.name}`,
      () => editRegion(player, currentRegion, () => regionForm(player)),
    )

  for (const r of createableRegions) {
    form.addButton(r.name, reg(r.region))
  }
  form.show(player)
}

function regionList(player: Player, RegionType: typeof Region, back = () => regionForm(player)) {
  const form = new ActionForm('Список ' + RegionType.name)

  form
    .addButton(ActionForm.backText, back)
    .addButton('Создать Сферический', BUTTON['+'], () => {
      new ModalForm('Создать Сферический ' + RegionType.name)
        .addTextField('Центр', '~~~', '~~~')
        .addSlider('Радиус', 1, 100, 1)
        .show(player, (ctx, rawCenter, radius) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          editRegion(player, RegionType.create(new SphereArea({ radius, center }, player.dimension.type)), () =>
            regionList(player, RegionType, back),
          )
        })
    })
    .addButton('Создать Кубический', BUTTON['+'], () => {
      new ModalForm('Создать Кубический' + RegionType.name)
        .addTextField('От', '~~~', '~~~')
        .addTextField('До', '~~~', '~~~')
        .show(player, (ctx, rawFrom, rawTo) => {
          const from = parseLocationFromForm(ctx, rawFrom, player)
          const to = parseLocationFromForm(ctx, rawTo, player)
          if (!from || !to) return

          editRegion(player, RegionType.create(new RectangleArea({ from, to }, player.dimension.type)), () =>
            regionList(player, RegionType, back),
          )
        })
    })

  for (const region of RegionType.getAll()) {
    form.addButton(region.name, () => editRegion(player, region, () => regionList(player, RegionType, back)))
  }
  form.show(player)
}

const pluralForms: WordPluralForms = ['региона', 'регион', 'в регионе']

function editRegion(player: Player, region: Region, back: () => void) {
  const selfback = () => editRegion(player, region, back)
  const form = new ActionForm(
    `Регион ${region.name}`,
    textTable({
      'Тип региона': region.creator.name,
      'Центр': Vector.string(region.area.center, true),
      'Радиус': region.area instanceof SphereArea ? region.area.radius : 'не поддерживается',
      ...region.customFormDescription(player),
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
    const exists = region.structure.exists
    const color = exists ? '' : '§7'

    if (exists)
      form.addButton(`Установить структуру в мир`, async () => {
        if (!region.structure) return
        player.info('Загружаем структуру...')
        try {
          await region.structure.place()
          player.success('Структура загружена!')
        } catch (e) {
          console.log(e)
          player.fail(t.error`Не удалось загрузить структуру: ${e}`)
        }
      })

    form.addButton(`${color}${exists ? 'Перес' : 'С'}охранить структуру`, async () => {
      player.info('Сохраняем структуру...')
      try {
        if (exists) region.structure?.delete()
        await region.structure?.save()

        player.success('Структура успешно сохранена')
      } catch (e) {
        console.log(e)
        player.fail(t.error`Не удалось сохранить структуру: ${e}`)
      }
    })
    if (exists) form.addButtonAsk('§cУдалить структуру', '§cУдалить', () => region.structure?.delete())
  }

  region.customFormButtons(form, player)

  form.addButton('Переместиться в регион', () => player.teleport(region.area.center))
  form.addButtonAsk('§cУдалить регион', '§cУдалить', () => region.delete(), '§aНе удалять').show(player)
}

function parseLocationFromForm(ctx: FormCallback<ModalForm>, location: string, player: Player) {
  const [x, y, z] = parseArguments(location)
  if (!x || !y || !z) return ctx.error('Неправильные координаты: ' + inspect(location))

  const parsed = parseLocationArguments([x, y, z], player)
  if (!parsed) return ctx.error('Неправильная локация: ' + inspect(location))

  return Vector.floor(parsed)
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

// TODO Remove use of the plural forms
// TODO Migrate to settingsMenu after its refactor

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
        form.addButtonAsk(
          isOwner ? `Передать права владельца ${pluralForms[0]}` : `Назначить владельцем ${pluralForms[0]}`,
          'Передать',
          () => {
            region.permissions.owners = region.permissions.owners.sort(a => (a === memberId ? 1 : -1))
            applyAction()
          },
        )

      form
        .addButtonAsk('§cУдалить участника', '§cУдалить', () => {
          region.permissions.owners = region.permissions.owners.filter(e => e !== memberId)
          applyAction()
        })
        .show(player)
    })
  }

  form.show(player)
}
