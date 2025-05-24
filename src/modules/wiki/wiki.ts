import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { getAuxOrTexture, langToken, selectByChance } from 'lib'
import { form } from 'lib/form/new'
import { t, textTable } from 'lib/text'
import { ores } from 'modules/places/mineshaft/algo'
import { OreEntry } from 'modules/places/mineshaft/ore-collector'

new Command('wiki')
  .setDescription('Что где как все расскажу')
  .setAliases('w')
  .setPermissions('everybody')
  .executes(ctx => wiki.show(ctx.player))

export const wiki = form(f => {
  f.title('Википедия', '§c§u§s§r')
  f.button('Руды', 'textures/blocks/diamond_ore.png', wikiOres)
})

export const wikiOres = form((f, player) => {
  f.title('Руды')
  const totalChance = selectByChance.getTotalChance(ores.getAll())

  // TODO Make this donate feature hahaha heheheh im evil yesyes
  const y = player.location.y
  const nowAvailable = ores.getAtY(y)
  const nowAvailableChance = selectByChance.getTotalChance(nowAvailable)
  if (nowAvailable.length) {
    const ores = nowAvailable.map(entry => {
      const chance = getChance(entry.chance, nowAvailableChance)
      return { entry, text: oreName(entry.item, chance, ' '), chance }
    })
    f.button(t`Руды на y: ${y}:\n${ores.map(e => e.text).join(', ')}`, wikiOresAtY(ores, y))
  } else {
    f.button('На этой высоте руд нет', wikiOres)
  }

  for (const { item, chance } of ores.getAll()) {
    f.button(
      t`${oreName(item, getChance(chance, totalChance))}, ${`§7${item.below}...${item.above}`}, Группа: ${item.groupChance}%%`,
      getOreTexture(item),
      wikiOre({ item, chance: chance / totalChance }),
    )
  }
})

const wikiOresAtY = (ores: { text: string; entry: OreEntry; chance: number }[], y: number) =>
  form(f => {
    f.title(t`Руды на ${y}`)
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
  return t`${`%${langToken(item.types[0] ?? MinecraftBlockTypes.Stone)}`}${separator}${chance}%%`
}

const wikiOre = ({ item }: OreEntry) =>
  form(f => {
    f.title(t`${`%${langToken(item.types[0] ?? MinecraftBlockTypes.Stone)}`}`)
    f.body(
      textTable({
        Под: item.below,
        Над: item.above,
      }),
    )
  })
