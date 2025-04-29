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
  const nowAvailable = ores.getAtY(player.location.y)
  if (nowAvailable.length) {
  } else {
    f.button('На этой высоте руд нет', wikiOres)
  }

  for (const { item, chance } of ores.getAll()) {
    f.button(
      t`${'%' + langToken(item.types[0])}\n${(chance / totalChance) * 100}%%, ${`§7${item.below}...${item.above}`}, Группа: ${item.groupChance}%%`,
      getAuxOrTexture(item.types[0]),
      wikiOre({ item, chance: chance / totalChance }),
    )
  }
})

const wikiOre = ({ item }: OreEntry) =>
  form(f => {
    f.title(t`${langToken(item.types[0])}`)
    f.body(
      textTable({
        Под: item.below,
        Над: item.above,
      }),
    )
  })
