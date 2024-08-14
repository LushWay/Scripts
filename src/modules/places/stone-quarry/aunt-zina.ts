import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Barman extends ShopNpc {
  constructor(group: Group) {
    super(group.point('aunt-zina').name('Тетя Зина'))
    this.shop.body(() => 'Заходиии, располагайся. Вся еда свежая, только из печи!\n\n')

    this.shop.menu(form => {
      form.addItemStack(new ItemStack(i.CookedBeef), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedChicken), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedCod), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedMutton), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedPorkchop), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedRabbit), new MoneyCost(200))
      form.addItemStack(new ItemStack(i.CookedSalmon), new MoneyCost(200))
    })
  }
}
