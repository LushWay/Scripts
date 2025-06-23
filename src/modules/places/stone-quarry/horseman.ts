import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'

export class Horseman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('horseman').name(t`Кучер`))
    this.shop.body(
      () => t`Wtf ой то есть мне пока нечего тебе предложить

`,
    )

    this.shop.menu(form => {
      form.itemStack(new ItemStack(i.HorseSpawnEgg), new MoneyCost(200_000))
    })
  }
}
