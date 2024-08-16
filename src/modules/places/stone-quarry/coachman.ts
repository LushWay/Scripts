import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Coachman extends ShopNpc {
  constructor(group: Group) {
    super(group.point('coachman').name('Кучер'))
    this.shop.body(() => 'Wtf ой то есть мне пока нечего тебе предложить\n\n')

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.HorseSpawnEgg), new MoneyCost(200_000))
    })
  }
}
