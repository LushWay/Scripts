import { MinecraftItemTypes as i, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { ShopNpc } from 'lib/shop/npc'

export class Woodman extends ShopNpc {
  constructor(group: Group) {
    super(group.place('woodman').name(i18nShared`Дровосек`))
    this.shop.body(() => i18n`Я рублю топором только дерево, не пытайтесь заказать у меня убийство.\n\n`)

    this.shop.menu(form => {
      const planks = shopFormula.shop[MinecraftItemTypes.OakPlanks]
      const log = shopFormula.shop[MinecraftItemTypes.OakLog]

      for (const [name, typeId] of Object.entries(i)) {
        if (name.startsWith('Warped') || name.startsWith('Crimson') || name === 'Planks' || name === 'Log') continue

        if (name.endsWith('Planks')) {
          form.dynamicCostItem(typeId as keyof (typeof shopFormula)['shop'], planks)
        } else if (name.endsWith('Log')) {
          form.dynamicCostItem(typeId as keyof (typeof shopFormula)['shop'], log)
        }
      }
    })
  }
}
