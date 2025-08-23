import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { getAuxOrTexture, langToken } from 'lib'
import { form } from 'lib/form/new'
import { i18n, textTable } from 'lib/i18n/text'
import { selectByChance } from 'lib/rpg/random'
import { ores } from 'modules/places/mineshaft/algo'
import { OreEntry } from 'modules/places/mineshaft/ore-collector'

new Command('wiki')
  .setDescription(i18n`Что где как все расскажу`)
  .setAliases('w')
  .setPermissions('everybody')
  .executes(ctx => wiki.show(ctx.player))

export const wiki = form(f => {
  f.title(i18n`Википедия`, '§c§u§s§r')
  f.button(i18n`Руды`, 'textures/blocks/diamond_ore.png', wikiOres)
})

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
