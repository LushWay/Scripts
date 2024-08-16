import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Scavenger extends ShopNpc {
  constructor(group: Group) {
    super(group.point('scavenger').name('Мусорщик'))
    this.shop.body(() => 'Скоро ты сможешь прдавать мне весь свой мусор хеехех\n\n')

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.OakSapling), new MoneyCost(1))
    })
  }
}
