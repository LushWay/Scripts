import { LocationInUnloadedChunkError, MolangVariableMap, Player, system, world } from '@minecraft/server'
import 'lib/command'
import { parseArguments, parseLocationArguments } from 'lib/command/utils'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { form, NewFormCreator } from 'lib/form/new'
import { BUTTON, FormCallback } from 'lib/form/utils'
import { Region } from 'lib/region/kinds/region'
import { t, textTable } from 'lib/text'
import { inspect } from 'lib/util'
import { Vec } from 'lib/vector'
import { Area } from './areas/area'
import { ChunkCubeArea } from './areas/chunk-cube'
import { CylinderArea } from './areas/cylinder'
import { FlattenedSphereArea } from './areas/flattened-sphere'
import { RectangleArea } from './areas/rectangle'
import { SphereArea } from './areas/sphere'

export const regionTypes: { name: string; region: typeof Region; creatable: boolean; displayName: boolean }[] = []
export function registerRegionType(name: string, region: typeof Region, creatable = true, displayName = !creatable) {
  regionTypes.push({ name, region, creatable, displayName })
}

const command = new Command('region')
  .setDescription('Управляет регионами')
  .setPermissions('techAdmin')
  .setGroup('public')
  .executes(ctx => {
    regionForm(ctx.player)
  })

const db = table<{ enabled: boolean }>('regionBorders', () => ({ enabled: false }))

command
  .overload('borders')
  .executes(ctx => ctx.player.tell(t`Borders enabled: ${db.get(ctx.player.id).enabled}`))
  .boolean('toggle', true)
  .executes((ctx, newValue = !db.get(ctx.player.id).enabled) => {
    ctx.player.tell(t`${db.get(ctx.player.id).enabled} -> ${newValue}`)
    ctx.player.database
    db.get(ctx.player.id).enabled = newValue
  })

const variables = new MolangVariableMap()
variables.setColorRGBA('color', { red: 0, green: 1, blue: 0, alpha: 0 })

system.runInterval(
  () => {
    if (!db.values().some(e => e.enabled)) return
    const players = world.getAllPlayers()

    for (const region of Region.regions) {
      if (!(region.area instanceof SphereArea)) continue

      const playersNearRegion = players.filter(e => region.area.isNear(e, 30))
      if (!playersNearRegion.length) continue

      let skip = 0
      region.area.forEachVector((vector, isIn) => {
        skip++
        if (skip % 2 === 0) return
        if (!Region.regions.includes(region)) return

        try {
          const r = Vec.distance(region.area.center, vector)
          if (isIn && r > region.area.radius - 1) {
            for (const player of playersNearRegion) {
              if (!player.isValid) continue
              if (!db.get(player.id).enabled) continue

              player.spawnParticle('minecraft:wax_particle', vector, variables)
            }
          }
        } catch (e) {
          if (e instanceof LocationInUnloadedChunkError) return
          throw e
        }
      }, 100)
    }
  },
  'region borders',
  40,
)

function regionForm(player: Player) {
  form(f => {
    f.title('Управление регионами')
    f.body('§7Чтобы создать регион, перейдите в список определенных регионов')

    const currentRegions = Region.getManyAt(player)
    const currentRegion = currentRegions[0]

    function addRegionButton(currentRegion: Region, form: NewFormCreator) {
      form.button(
        t`${currentRegion.displayName ?? 'Без имени'} (${currentRegion.area.toString()})\n${currentRegion.name}`,
        () => editRegion(player, currentRegion, false, () => regionForm(player)),
      )
    }

    if (typeof currentRegion !== 'undefined') addRegionButton(currentRegion, f)

    if (currentRegions.length > 1) {
      f.button(
        form(f => {
          f.title(
            t`Другие регионы тут (${currentRegions.length - 1})\n${[...new Set(currentRegions.map(e => e.creator.kind))].join(' ')}`,
          )
          for (const region of currentRegions.slice(1)) addRegionButton(region, f)
        }),
      )
    }

    for (const type of regionTypes) {
      f.button(t`${type.name}${t.size(type.region.getAll().length)}`, () =>
        regionList(player, type.region, type.creatable, type.displayName),
      )
    }
  }).show(player)
}

function regionList(
  player: Player,
  RegionType: typeof Region,
  creatable = true,
  displayName = creatable,
  back = () => regionForm(player),
) {
  const form = new ActionForm('Список ' + RegionType.name)
  const selfback = () => regionList(player, RegionType, creatable, displayName, back)

  if (creatable)
    form.addButton('Добавить', BUTTON['+'], () => {
      const form = new ActionForm('Выбери тип области региона')
      selectArea(form, player, area => {
        editRegion(player, RegionType.create(area), displayName, selfback)
      })
      form.show(player)
    })

  for (const region of RegionType.getAll()) {
    form.addButton(t`${displayName ? region.displayName : region.name}\n${region.area.toString()}`, () =>
      editRegion(player, region, displayName, selfback),
    )
  }

  form.show(player)
}

function selectArea(form: ActionForm, player: Player, onSelect: (area: Area) => void) {
  form
    .addButton('Сфера', BUTTON['+'], () => {
      new ModalForm('Сфера')
        .addTextField('Центр', '~~~', '~~~')
        .addSlider('Радиус', 1, 100, 1)
        .show(player, (ctx, rawCenter, radius) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          if (center.y - radius <= -64)
            return player.fail(
              `Нельзя создать регион, область которого ниже -64 (y: ${center.y} radius: ${radius} result: ${center.y - radius})`,
            )

          onSelect(new SphereArea({ radius, center }, player.dimension.type))
        })
    })
    .addButton('Куб', BUTTON['+'], () => {
      new ModalForm('Куб')
        .addTextField('От', '~~~', '~~~')
        .addTextField('До', '~~~', '~~~')
        .show(player, (ctx, rawFrom, rawTo) => {
          const from = parseLocationFromForm(ctx, rawFrom, player)
          const to = parseLocationFromForm(ctx, rawTo, player)
          if (!from || !to) return

          onSelect(new RectangleArea({ from, to }, player.dimension.type))
        })
    })
    .addButton('Куб без учета высоты', BUTTON['+'], () => {
      new ModalForm('Куб без учета высоты')
        .addTextField('От', '~~~', '~~~')
        .addTextField('До', '~~~', '~~~')
        .show(player, (ctx, rawFrom, rawTo) => {
          const from = parseLocationFromForm(ctx, rawFrom, player)
          const to = parseLocationFromForm(ctx, rawTo, player)
          if (!from || !to) return

          onSelect(new ChunkCubeArea({ from, to }, player.dimension.type))
        })
    })
    .addButton('Цилиндр', BUTTON['+'], () => {
      new ModalForm('Цилиндр')
        .addTextField('Центр', '~~~', '~~~')
        .addSlider('Радиус', 1, 100, 1)
        .addSlider('Высота', 1, 100, 1)
        .show(player, (ctx, rawCenter, radius, yradius) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          onSelect(new CylinderArea({ center, radius, yradius }, player.dimension.type))
        })
    })
    .addButton('Приплюснутая сфера', BUTTON['+'], () => {
      new ModalForm('Приплюснутая сфера')
        .addTextField('Центр', '~~~', '~~~')
        .addSlider('Радиус', 1, 100, 1)
        .addSlider('Высота', 1, 100, 1)
        .show(player, (ctx, rawCenter, rx, ry) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          onSelect(new FlattenedSphereArea({ center, rx, ry }, player.dimension.type))
        })
    })
}

const pluralForms: WordPluralForms = ['региона', 'регион', 'в регионе']

function editRegion(player: Player, region: Region, displayName: boolean, back: () => void) {
  const selfback = () => editRegion(player, region, displayName, back)
  const form = new ActionForm(
    displayName ? (region.displayName ?? region.creator.name) : region.name,
    textTable({
      'Тип региона': region.creator.name,
      'Тип зоны': Area.areas.find(e => e.type === region.area.type)?.name ?? region.area.type,
      ...region.area.getFormDescription(),
      ...region.customFormDescription(player),
    }),
  )
    .addButton(ActionForm.backText, back)
    .addButton('Участники', () => manageRegionMembers(player, region, { isOwner: true, back: selfback, pluralForms }))
    .addButton('Разрешения', () =>
      editRegionPermissions(player, region, { pluralForms, back: selfback, extendedEditPermissions: true }),
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

  form.addButton('Заменить зону', () => {
    const form = new ActionForm('Заменить зону')
    selectArea(form, player, area => {
      // Area changed, need to update chunk query storages too
      Region.chunkQuery.remove(region)

      region.area = area
      region.save()

      Region.chunkQuery.add(region)
    })
    form.show(player)
  })

  form.addButtonAsk('§cУдалить регион', '§cУдалить', () => (region.delete(), back()), '§aНе удалять').show(player)
}

function parseLocationFromForm(ctx: FormCallback<ModalForm>, location: string, player: Player) {
  const [x, y, z] = parseArguments(location)
  if (!x || !y || !z) return ctx.error('Неправильные координаты: ' + inspect(location))

  const parsed = parseLocationArguments([x, y, z], player)
  if (!parsed) return ctx.error('Неправильная локация: ' + inspect(location))

  return Vec.floor(parsed) as Vector3
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
      { true: 'Да', pve: 'Только с сущностями (pve)', false: 'Нет' },
      { defaultValueIndex: String(region.permissions.pvp) },
    )

    if (region.area instanceof SphereArea)
      form
        .addSlider(`Радиус\n§7Определяет радиус ${pluralForms[0]}`, 1, 100, 1, region.area.radius)
        .addTextField('Центр региона', Vec.string(region.area.center), Vec.string(region.area.center))
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

  const selfback = () => manageRegionMembers(player, region, { back, member, isOwner, pluralForms })

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
