import { LocationInUnloadedChunkError, MolangVariableMap, Player, system, world } from '@minecraft/server'
import 'lib/command'
import { parseArguments, parseLocationArguments } from 'lib/command/utils'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ModalForm } from 'lib/form/modal'
import { form, NewFormCreator } from 'lib/form/new'
import { BUTTON, FormCallback } from 'lib/form/utils'
import { i18n, noI18n, textTable } from 'lib/i18n/text'
import { Region } from 'lib/region/kinds/region'
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
  .setDescription(i18n`Управляет регионами`)
  .setPermissions('techAdmin')
  .setGroup('public')
  .executes(ctx => {
    regionForm(ctx.player)
  })

const db = table<{ enabled: boolean }>('regionBorders', () => ({ enabled: false }))

command
  .overload('borders')
  .executes(ctx => ctx.player.tell(noI18n`Borders enabled: ${db.get(ctx.player.id).enabled}`))
  .boolean('toggle', true)
  .executes((ctx, newValue = !db.get(ctx.player.id).enabled) => {
    ctx.player.tell(noI18n`${db.get(ctx.player.id).enabled} -> ${newValue}`)
    ctx.player.database
    db.get(ctx.player.id).enabled = newValue
  })

command
  .overload('permdebug')
  .setPermissions('everybody')
  .executes(ctx => {
    Region.permissionDebug = !Region.permissionDebug
    ctx.reply(`Changed to ${Region.permissionDebug}`)
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
    f.title(noI18n`Управление регионами`)
    f.body(noI18n`Чтобы создать регион, перейдите в список определенных регионов`)

    const currentRegions = Region.getManyAt(player)
    const currentRegion = currentRegions[0]

    function addRegionButton(currentRegion: Region, form: NewFormCreator) {
      form.button(
        noI18n`${currentRegion.displayName ?? noI18n`Без имени`} (${currentRegion.area.toString()})\n${currentRegion.name}`,
        () => editRegion(player, currentRegion, false, () => regionForm(player)),
      )
    }

    if (typeof currentRegion !== 'undefined') addRegionButton(currentRegion, f)

    if (currentRegions.length > 1) {
      f.button(
        form(f => {
          f.title(
            noI18n`Другие регионы тут (${currentRegions.length - 1})\n${[...new Set(currentRegions.map(e => e.creator.kind))].join(' ')}`,
          )
          for (const region of currentRegions.slice(1)) addRegionButton(region, f)
        }),
      )
    }

    for (const type of regionTypes) {
      f.button(i18n.join`${type.name}`.size(type.region.getAll().length), () =>
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
  const form = new ActionForm(noI18n`Список ` + RegionType.name)
  const selfback = () => regionList(player, RegionType, creatable, displayName, back)

  if (creatable)
    form.button(noI18n`Добавить`, BUTTON['+'], () => {
      const form = new ActionForm(noI18n`Выбери тип области региона`)
      selectArea(form, player, area => {
        editRegion(player, RegionType.create(area), displayName, selfback)
      })
      form.show(player)
    })

  for (const region of RegionType.getAll()) {
    form.button(noI18n`${displayName ? region.displayName : region.name}\n${region.area.toString()}`, () =>
      editRegion(player, region, displayName, selfback),
    )
  }

  form.show(player)
}

function selectArea(form: ActionForm, player: Player, onSelect: (area: Area) => void) {
  form
    .button(noI18n`Сфера`, BUTTON['+'], () => {
      new ModalForm(noI18n`Сфера`)
        .addTextField(noI18n`Центр`, '~~~', '~~~')
        .addSlider(noI18n`Радиус`, 1, 100, 1)
        .show(player, (ctx, rawCenter, radius) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          if (center.y - radius <= -64)
            return player.fail(
              i18n`Нельзя создать регион, область которого ниже -64 (y: ${center.y} radius: ${radius} result: ${center.y - radius})`,
            )

          onSelect(new SphereArea({ radius, center }, player.dimension.type))
        })
    })
    .button(noI18n`Куб`, BUTTON['+'], () => {
      new ModalForm(noI18n`Куб`)
        .addTextField(noI18n`От`, '~~~', '~~~')
        .addTextField(noI18n`До`, '~~~', '~~~')
        .show(player, (ctx, rawFrom, rawTo) => {
          const from = parseLocationFromForm(ctx, rawFrom, player)
          const to = parseLocationFromForm(ctx, rawTo, player)
          if (!from || !to) return

          onSelect(new RectangleArea({ from, to }, player.dimension.type))
        })
    })
    .button(noI18n`Куб без учета высоты`, BUTTON['+'], () => {
      new ModalForm(noI18n`Куб без учета высоты`)
        .addTextField(noI18n`От`, '~~~', '~~~')
        .addTextField(noI18n`До`, '~~~', '~~~')
        .show(player, (ctx, rawFrom, rawTo) => {
          const from = parseLocationFromForm(ctx, rawFrom, player)
          const to = parseLocationFromForm(ctx, rawTo, player)
          if (!from || !to) return

          onSelect(new ChunkCubeArea({ from, to }, player.dimension.type))
        })
    })
    .button(noI18n`Цилиндр`, BUTTON['+'], () => {
      new ModalForm(noI18n`Цилиндр`)
        .addTextField(noI18n`Центр`, '~~~', '~~~')
        .addSlider(noI18n`Радиус`, 1, 100, 1)
        .addSlider(noI18n`Высота`, 1, 100, 1)
        .show(player, (ctx, rawCenter, radius, yradius) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          onSelect(new CylinderArea({ center, radius, yradius }, player.dimension.type))
        })
    })
    .button(noI18n`Приплюснутая сфера`, BUTTON['+'], () => {
      new ModalForm(noI18n`Приплюснутая сфера`)
        .addTextField(noI18n`Центр`, '~~~', '~~~')
        .addSlider(noI18n`Радиус`, 1, 100, 1)
        .addSlider(noI18n`Высота`, 1, 100, 1)
        .show(player, (ctx, rawCenter, rx, ry) => {
          const center = parseLocationFromForm(ctx, rawCenter, player)
          if (!center) return

          onSelect(new FlattenedSphereArea({ center, rx, ry }, player.dimension.type))
        })
    })
}

function editRegion(player: Player, region: Region, displayName: boolean, back: () => void) {
  const selfback = () => editRegion(player, region, displayName, back)
  const form = new ActionForm(
    (displayName ? (region.displayName ?? region.creator.name) : region.name).to(player.lang),
    textTable([
      [i18n`Тип региона`, region.creator.name],
      [i18n`Тип зоны`, Area.areas.find(e => e.type === region.area.type)?.name ?? region.area.type],
      ...region.area.getFormDescription(),
      ...region.customFormDescription(player),
    ]).to(player.lang),
  )
    .button(ActionForm.backText.to(player.lang), back)
    .button(i18n`Участники`.to(player.lang), () =>
      manageRegionMembers({ region, isOwner: true }).show(player, selfback),
    )
    .button(i18n`Разрешения`.to(player.lang), () =>
      editRegionPermissions(player, region, { back: selfback, extendedEditPermissions: true }),
    )

  // TODO Move to separate form / regroup
  if (region.structure) {
    const exists = region.structure.exists
    const color = exists ? noI18n : noI18n.warn

    if (exists)
      form.button(noI18n`Установить структуру в мир`, async () => {
        if (!region.structure) return
        player.info(noI18n`Загружаем структуру...`)
        try {
          await region.structure.place()
          player.success(noI18n`Структура загружена!`)
        } catch (e) {
          console.log(e)
          player.fail(noI18n.error`Не удалось загрузить структуру: ${e}`)
        }
      })

    form.button(exists ? color`Пересохранить структуру` : color`Сохранить структуру`, async () => {
      player.info(noI18n`Сохраняем структуру...`)
      try {
        if (exists) region.structure?.delete()
        await region.structure?.save()

        player.success(noI18n`Структура успешно сохранена`)
      } catch (e) {
        console.log(e)
        player.fail(i18n.error`Не удалось сохранить структуру: ${e}`)
      }
    })
    if (exists) form.ask(noI18n`§cУдалить структуру`, noI18n`§cУдалить`, () => region.structure?.delete())
  }

  region.customFormButtons(form, player)

  form.button(noI18n`Переместиться в регион`, () => player.teleport(region.area.center))

  form.button(noI18n`Заменить зону`, () => {
    const form = new ActionForm(noI18n`Заменить зону`)
    selectArea(form, player, area => {
      // Area changed, need to update chunk query storages too
      Region.chunkQuery.remove(region)

      region.area = area
      region.save()

      Region.chunkQuery.add(region)
    })
    form.show(player)
  })

  form.ask(noI18n.error`Удалить регион`, noI18n.error`Удалить`, () => (region.delete(), back())).show(player)
}

function parseLocationFromForm(ctx: FormCallback<ModalForm>, location: string, player: Player) {
  const [x, y, z] = parseArguments(location)
  if (!x || !y || !z) return ctx.error(noI18n`Неправильные координаты: ` + inspect(location))

  const parsed = parseLocationArguments([x, y, z], player)
  if (!parsed) return ctx.error(noI18n`Неправильная локация: ` + inspect(location))

  return Vec.floor(parsed) as Vector3
}

export function editRegionPermissions(
  player: Player,
  region: Region,
  { back, extendedEditPermissions = false }: { extendedEditPermissions?: boolean; back: VoidFunction },
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
  > = new ModalForm(i18n`Разрешения региона`.to(player.lang))
    .addToggle(
      i18n`Двери\n§7Определяет, смогут ли не добавленные в регион игроки использовать двери.`.to(player.lang),
      region.permissions.doors,
    )
    .addToggle(
      i18n`Рычаг и кнопки\n§7Определяет, смогут ли не добавленные в регион игроки использовать рычаг и кнопки.`.to(
        player.lang,
      ),
      region.permissions.switches,
    )
    .addToggle(
      i18n`Люки\n§7Определяет, смогут ли не добавленные в регион игроки использовать люки.`.to(player.lang),
      region.permissions.trapdoors,
    )
    .addToggle(
      i18n`Контейнеры\n§7Определяет, смогут ли не добавленные в регион игроки открывать контейнеры (сундуки, шалкеры и тд)`.to(
        player.lang,
      ),
      region.permissions.openContainers,
    )
    .addToggle(
      i18n`Калитки\n§7Определяет, смогут ли не добавленные в регион игроки использовать калитки.`.to(player.lang),
      region.permissions.gates,
    )

  if (extendedEditPermissions) {
    form = form.addDropdownFromObject(
      i18n`Сражение\n§7Определяет, смогут ли игроки сражаться в регионе`.to(player.lang),
      {
        true: i18n`Да`.to(player.lang),
        pve: i18n`Только с сущностями (pve)`.to(player.lang),
        false: i18n`Нет`.to(player.lang),
      },
      { defaultValueIndex: String(region.permissions.pvp) },
    )

    if (region.area instanceof SphereArea)
      form
        .addSlider(i18n`Радиус\n§7Определяет радиус региона`.to(player.lang), 1, 100, 1, region.area.radius)
        .addTextField(
          i18n`Центр региона`.to(player.lang),
          Vec.string(region.area.center),
          Vec.string(region.area.center),
        )
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

// TODO Migrate to settingsMenu after its refactor

export const manageRegionMembers = form.params<{
  region: Region
  isOwner?: boolean
  member?: ReturnType<Region['getMemberRole']>
}>(
  (f, { player, self, params: { region, member = region.getMemberRole(player.id), isOwner = member === 'owner' } }) => {
    f.title(i18n`Участники региона`)
    f.body(
      isOwner ? i18n`Для управления участником нажмите на кнопку с его ником` : i18n`Вы можете только посмотреть их`,
    )

    const applyAction = () => {
      region.save()
      self()
    }

    if (isOwner)
      f.button(
        i18n.accent`Добавить!`,
        BUTTON['+'],
        form(f => {
          f.title(i18n`Добавить участника`)
          for (const player of world.getAllPlayers())
            f.button(player.name, () => {
              region.permissions.owners.push(player.id)
              region.save()
            })
        }),
      )
    for (const [i, memberId] of region.permissions.owners.entries()) {
      const name = Player.nameOrUnknown(memberId)

      f.button(
        i === 0 ? i18n`Владелец > ${name}` : name,
        form(f => {
          f.title(name)
          f.body(i18n`Управление участником региона`)
          if (region.getMemberRole(memberId) !== 'owner')
            f.ask(
              isOwner ? i18n`Передать права владельца региона` : i18n`Назначить владельцем региона`,
              i18n`Передать`,
              () => {
                region.permissions.owners = region.permissions.owners.sort(a => (a === memberId ? 1 : -1))
                applyAction()
              },
            )

          f.ask(i18n.error`Удалить участника`, i18n.error`Удалить`, () => {
            region.permissions.owners = region.permissions.owners.filter(e => e !== memberId)
            applyAction()
          })
        }),
      )
    }
  },
)
