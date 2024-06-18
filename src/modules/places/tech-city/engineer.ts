import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Cost, MultiCost } from 'lib/shop/cost'
import { Shop } from 'lib/shop/shop'
import { CustomItemWithBlueprint } from '../../../lib/rpg/custom-item'
import { BaseItem } from '../base/base'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .setTypeId(i.PolishedTuffWall)
  .setNameTag('Пушка')
  .setDescription('Пушка заглушка, не работает пока')

export const CannonBulletItem = new CustomItemWithBlueprint('cannon bullet')
  .setTypeId(i.PolishedTuffSlab)
  .setNameTag('Снаряд для пушки')
  .setDescription('Да.')

export class Engineer {
  constructor(public group: string) {
    const { shop } = Shop.npc({
      group,
      id: 'engineer',
      name: 'Инженер',
      body: () => 'Ну типа дай мне чертеж, a я те чета там наколупаю, да',
      dimensionId: 'overworld',
    })

    shop.menu((menu, player) => {
      function addItem(item: CustomItemWithBlueprint, cost: Cost) {
        menu.addItemStack(item.itemStack, new MultiCost(cost).item(item.blueprint))
      }

      addItem(BaseItem, new MultiCost().money(1000))
      addItem(CannonItem, new MultiCost().money(200))
      addItem(CannonBulletItem, new MultiCost().money(100).item(new ItemStack(i.SlimeBall)))

      menu.addSection('Все для редстоуна', menu => {
        menu.addItemStack(new ItemStack(i.Slime), new MultiCost().money(5))
        menu.addItemStack(new ItemStack(i.HoneyBlock), new MultiCost().money(10))
        menu.addItemStack(new ItemStack(i.Piston), new MultiCost().money(8))
      })
    })
  }
}
