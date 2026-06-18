import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { formArray } from 'lib/form/array-new'
import { getAuxOrTexture } from 'lib/form/chest'
import { form } from 'lib/form/new'
import { QuestForm } from 'lib/form/quest'
import { BUTTON } from 'lib/form/utils'
import { langToken, translateTypeId } from 'lib/i18n/lang'
import { i18n, i18nShared, textTable } from 'lib/i18n/text'
import { Quest } from 'lib/quest'
import { PlayerQuestStub } from 'lib/quest/player'
import { noGroup, Place } from 'lib/rpg/place'
import { selectByChance } from 'lib/rpg/random'
import { ItemResource, Resource, ResourceDescripton, ResourceLocation, ResourcesSource } from 'lib/rpg/resource-source'
import { noBoolean } from 'lib/util'
import { onLoad } from 'lib/utils/load-ref'
import { ores } from 'modules/places/mineshaft/algo'
import { OreEntry } from 'modules/places/mineshaft/ore-collector'

new Command('wiki')
  .setDescription(i18n`Что где как все расскажу`)
  .setAliases('w')
  .setPermissions('everybody')
  .executes(ctx => wiki.show(ctx.player))

export const wiki = form(f => {
  f.title(i18n`Википедия`, '§c§u§s§r')
  f.button(i18n`Руды`, 'textures/blocks/diamond_ore', wikiOres)
  f.button(i18n`Ресурсы`, 'textures/items/diamond', wikiItems)
  f.button(i18n`Ресурсы по локациям`, BUTTON.search, wikiLocations)
})

const wikiLocations = formArray(f => {
  f.title(i18n`Ресурсы по локациям`)
  f.array(
    ResourcesSource.sources.flatMap(source =>
      source.locations.map(location => ({ location, resources: source.resources })),
    ),
  ).button(({ location, resources }) => {
    return [getNameFromPlace(location.place), wikiLocationItems({ location, resources }).show]
  })
})

const wikiLocationItems = formArray.params<{ location: ResourceLocation; resources: Resource[] }>(
  (f, { params: { location, resources } }) => {
    f.title(getNameFromPlace(location.place))
    f.array(resources).button(resource => [
      resource.displayName,
      wikiItemLocation({ resource, location: { location } }).show,
    ])
  },
)

function getNameFromPlace(place: Place) {
  return i18n.join` ${place.group.name ? i18n.join`${place.group.name} ` : ''}${place.name}`
}

const wikiItems = formArray((f, { player }) => {
  const items = ResourcesSource.getMap().reduce<
    { resource: Resource; locations: { location: ResourceLocation; description?: ResourceDescripton }[] }[]
  >((acc, [items, source]) => {
    for (const resource of items) {
      const { description } = resource
      const byItem = acc.find(e => e.resource.equals(resource))
      if (byItem) {
        for (const location of source.locations) {
          byItem.locations.push({ location, description })
        }
      } else {
        acc.push({
          resource,
          locations: source.locations.map(location => ({ location, description })),
        })
      }
    }
    return acc
  }, [])

  f.title(i18n`Ресурсы`)

  f.array(items)
    .filters({
      food: { name: 'Еда', value: false },
    })
    .sort((arr, filters) => {
      if (filters.food) arr = arr.filter(e => e.resource instanceof ItemResource && e.resource.itemStack.food)

      return arr.sort((a, b) => b.resource.categoryPriority - a.resource.categoryPriority)
    })
    .button(
      ({ resource, locations }) =>
        [
          i18n.join`${resource.displayName}\n${locations.map(e => e.location.place.name.to(player.lang)).join(', ')}`,
          wikiItemLocations({ resource, locations }).show,
          resource.icon,
        ] as const,
    )
})

interface RL {
  location: ResourceLocation
  description?: ResourceDescripton
}

const wikiItemLocations = formArray.params<{
  resource: Resource
  locations: RL[]
}>((f, { player, params: { locations, resource } }) => {
  f.title(resource.displayName)
  f.array(locations).button(item => {
    return [
      i18n.join`${getNameFromPlace(item.location.place)}\n${Resource.toText(item.description, player)}`,
      wikiItemLocation({ resource, location: item }).show,
    ]
  })
})

const wikiItemLocation = form.params<{ resource: Resource; location: RL }>(
  (
    f,
    {
      player,
      self,
      params: {
        resource,
        location: { location, description },
      },
    },
  ) => {
    f.title(resource.displayName)
    const resDesc = Resource.toText(description, player)
    f.body(
      textTable([
        [i18n`Описание`, resDesc],
        [i18n`Локация`, location.place.name],
        location.place.group.name ? [i18n`Группа`, location.place.group.name] : '',
      ]),
    )

    new QuestForm(f, player, self).quest(
      location.reachQuest,
      undefined,
      i18n`Вы можете взять это задание чтобы отслеживать направления источника ресурса (${resource.displayName}) с помощью компаса`,
    )
  },
)

export const wikiOres = form((f, { player }) => {
  f.title(i18n`Руды`)
  const totalChance = selectByChance.getTotalChance(ores.getAll())

  // TODO Make this donate feature hahaha heheheh im evil yesyes
  const y = player.location.y
  const nowAvailable = ores.getAtY(y)
  const nowAvailableChance = selectByChance.getTotalChance(nowAvailable)
  if (nowAvailable.length) {
    const ores = nowAvailable.map(entry => {
      const chance = getChance(entry.weight, nowAvailableChance)
      return { entry, text: oreName(entry.item, chance, ' '), chance }
    })
    f.button(i18n`Руды на y: ${y}:\n${ores.map(e => e.text.to(player.lang)).join(', ')}`, wikiOresAtY(ores, y))
  } else {
    f.button(i18n`На этой высоте руд нет`, wikiOres)
  }

  for (const { item: ore, weight: chance } of ores.getAll()) {
    f.button(
      i18n`${oreName(ore, getChance(chance, totalChance))}, ${`§7${ore.below}...${ore.above}`}, Группа: ${ore.groupChance}%%`,
      getOreTexture(ore),
      wikiOre({ ore: ore }),
    )
  }
})

const amount = 10
export const mineQuests = onLoad(() =>
  ores
    .getAll()
    .map(({ item: ore }) => {
      const itemType = ore.types[0]
      if (!itemType) return false

      return {
        ore,
        quest: new Quest(
          noGroup
            .place(itemType + '-wiki-mine')
            .name(i18nShared`Добыть: ${{ rawtext: [{ translate: langToken(itemType) }] }}`),

          i18n`Спуститесь в шахту и вскопайте указанный ресурс!`,
          (q, player) => {
            if (q instanceof PlayerQuestStub) return // No cutscenes in this quest

            let y = ~~player.location.y

            const { below, above } = ore
            const inRange = () => y < below && y > above

            q.breakCounter(
              (c, end) =>
                inRange()
                  ? `${c}/${end} y=${above}..${y}..${below}`
                  : i18n.error`Копать нужно на высоте от ${above} до ${below}. Ваш y = ${y}`,
              amount,
            )
              .filter(({ type: { id } }) => ore.all.includes(id))
              .activate(ctx => {
                ctx.onInterval(() => {
                  y = ~~player.location.y
                  ctx.update()
                })
              })
          },
        ),
      }
    })
    .filter(noBoolean),
)

const wikiOresAtY = (ores: { text: Text; entry: OreEntry; chance: number }[], y: number) =>
  form(f => {
    f.title(i18n`Руды на ${y}`)
    for (const ore of ores.slice().sort((a, b) => b.chance - a.chance))
      f.button(ore.text, getOreTexture(ore.entry.item), wikiOre({ ore: ore.entry.item }))
  })

function getChance(chance: number, totalChance: number) {
  return (chance / totalChance) * 100
}

function getOreTexture(item: OreEntry['item']) {
  const newLocal = getAuxOrTexture(item.types[0] ?? MinecraftBlockTypes.Stone)
  console.log({ newLocal, a: item.types[0] })
  return newLocal
}

function oreName(item: OreEntry['item'], chance: number, separator = '\n') {
  return i18n`${`%${langToken(item.types[0] ?? MinecraftBlockTypes.Stone)}`}${separator}${chance}%%`
}

const wikiOre = form.params<{ ore: OreEntry['item'] }>((f, { player, self, params: { ore } }) => {
  f.title(translateTypeId(ore.types[0] ?? MinecraftBlockTypes.Stone, player.lang))
  f.body(
    textTable([
      [i18n`Под`, ore.below],
      [i18n`Над`, ore.above],
      [i18n`Типы`, ore.types.map(e => translateTypeId(e, player.lang)).join(', ')],
    ]),
  )

  const quest = mineQuests.value.find(e => e.ore === ore)
  if (quest) {
    new QuestForm(f, player, self).quest(quest.quest)
  }
})
