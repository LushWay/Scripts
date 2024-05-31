import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { ItemCost, MoneyCost, MultiCost } from 'lib/cost'
import { Shop } from 'lib/shop'

export default gunsmith

function gunsmith(group: string) {
  const { shop, entity } = Shop.npc({
    group,
    id: 'gunsmith',
    name: 'Оружейник',
    dimensionId: 'overworld',
    body: () => 'Чего пожелаешь?',
  })

  shop.menu((form, player) => {
    form.addSection('Улучшить оружие', form => {
      form.addProduct(
        'Улучшить незеритовый меч до алмазного',
        new MultiCost(
          new ItemCost(MinecraftItemTypes.DiamondSword, 1),
          new ItemCost(MinecraftItemTypes.NetheriteIngot, 10),
          new MoneyCost(1000),
        ),
        () => {
          console.log('Buy success')
        },
      )
    })
    form.addSection('Улучшить броню', form => {
      form
    })
  })

  return { shop, entity }
}
