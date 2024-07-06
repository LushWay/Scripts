import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes, MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { Cost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { CustomItemWithBlueprint } from '../../../lib/rpg/custom-item'
import { BaseItem } from '../base/base'

export const CannonItem = new CustomItemWithBlueprint('cannon')
  .typeId(i.PolishedTuffWall)
  .nameTag('Пушка')
  .lore('Пушка заглушка, не работает пока')

export const CannonBulletItem = new CustomItemWithBlueprint('cannon bullet')
  .typeId(i.PolishedTuffSlab)
  .nameTag('Снаряд для пушки')
  .lore('Да.')

export const MicroSchema = new ItemStack(MinecraftItemTypes.IronIngot).setInfo('Микросхема', 'Нужная фигня, да')

export class Engineer extends ShopNpc {
  constructor(public group: Group) {
    super(group.point('engineer').name('Инжeнер'))

    this.shop.body(() => 'Ну типа дай мне чертеж, a я те чета там наколупаю, да')
    this.shop.menu(menu => {
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
