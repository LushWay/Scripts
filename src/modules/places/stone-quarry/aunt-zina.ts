import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class AuntZina extends ShopNpc {
  constructor(group: Group) {
    super(group.point('aunt-zina').name('Тетя Зина'))
    this.shop.body(() => 'Заходиии, располагайся. Вся еда свежая, только из печи! Яблоко тоже.\n\n')

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.Apple, 64), new MoneyCost(500))
      form.itemStack(new ItemStack(i.CookedBeef, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedChicken, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedCod, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedMutton, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedPorkchop, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedRabbit, 64), new MoneyCost(200))
      form.itemStack(new ItemStack(i.CookedSalmon, 64), new MoneyCost(200))
    })
  }
}
