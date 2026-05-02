import { Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ArrayForm } from 'lib/form/array'
import { getAuxOrTexture } from 'lib/form/chest'
import { form } from 'lib/form/new'
import { langToken } from 'lib/i18n/lang'
import { i18n, textTable } from 'lib/i18n/text'
import { selectByChance } from 'lib/rpg/random'
import { ItemResource, Resource, ResourceDescripton, ResourceLocation, ResourcesSource } from 'lib/rpg/resource-source'
import { doNothing } from 'lib/util'
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
  f.button(i18n`Ресурсы`, 'textures/blocks/diamond', wikiItems)
  f.button(i18n`Ресурсы по локациям`, 'textures/blocks/dirt', wikiLocations)
})

function wikiLocations(player: Player, back?: PlayerCallback) {
  new ArrayForm(
    i18n`Ресурсы по локациям`,
    ResourcesSource.sources.flatMap(source =>
      source.locations.map(location => ({ location, resources: source.resources })),
    ),
  )
    .button(({ location, resources }) => [location.place.name, () => {}])
    .back(back)
    .show(player)
}

function wikiItems(player: Player, back?: PlayerCallback) {
  const self = () => wikiItems(player, back)

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
  new ArrayForm(i18n`Ресурсы`, items)
    .filters({
      food: { name: 'Еда', value: false },
    })
    .back(back)
    .sort((arr, filters) => {
      if (filters.food) arr = arr.filter(e => e.resource instanceof ItemResource && e.resource.itemStack.food)

      return arr.sort((a, b) => b.resource.categoryPriority - a.resource.categoryPriority)
    })
    .button(
      ({ resource, locations }) =>
        [
          i18n.join`${resource.displayName}\n${locations.map(e => e.location.place.name.to(player.lang)).join(', ')}`,
          () => wikiItemLocations(player, self, resource, locations),
          resource.icon,
        ] as const,
    )
    .show(player)
}

function wikiItemLocations(
  player: Player,
  back: PlayerCallback,
  resource: Resource,
  locations: { location: ResourceLocation; description?: ResourceDescripton }[],
) {
  new ArrayForm(resource.displayName, locations)
    .button(item => {
      const place = item.location.place
      return [
        i18n.join` ${place.group.name ? i18n.join`${place.group.name} ` : ''}${place.name}\n${Resource.toText(item.description, player)}`,
        doNothing,
      ]
    })
    .back(back)
    .show(player)
}

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

  for (const { item, weight: chance } of ores.getAll()) {
    f.button(
      i18n`${oreName(item, getChance(chance, totalChance))}, ${`§7${item.below}...${item.above}`}, Группа: ${item.groupChance}%%`,
      getOreTexture(item),
      wikiOre({ item, weight: chance / totalChance }),
    )
  }
})

const wikiOresAtY = (ores: { text: Text; entry: OreEntry; chance: number }[], y: number) =>
  form(f => {
    f.title(i18n`Руды на ${y}`)
    for (const ore of ores.slice().sort((a, b) => b.chance - a.chance))
      f.button(ore.text, getOreTexture(ore.entry.item), wikiOre(ore.entry))
  })

function getChance(chance: number, totalChance: number) {
  return (chance / totalChance) * 100
}

function getOreTexture(item: OreEntry['item']) {
  return getAuxOrTexture(item.types[0] ?? MinecraftBlockTypes.Stone)
}

function oreName(item: OreEntry['item'], chance: number, separator = '\n') {
  return i18n`${`%${langToken(item.types[0] ?? MinecraftBlockTypes.Stone)}`}${separator}${chance}%%`
}

const wikiOre = ({ item }: OreEntry) =>
  form(f => {
    f.title(i18n`%${langToken(item.types[0] ?? MinecraftBlockTypes.Stone)}`)
    f.body(
      textTable([
        [i18n`Под`, item.below],
        [i18n`Над`, item.above],
      ]),
    )
  })
