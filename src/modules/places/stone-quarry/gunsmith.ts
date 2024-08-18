import { ContainerSlot, ItemStack } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { langKey } from 'lib'
import { Group } from 'lib/rpg/place'
import { MoneyCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { copyAllItemPropertiesExceptEnchants } from '../village-of-explorers/mage'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.point('gunsmith').name('Оружейник'))
    this.shop.body(() => 'Чего пожелаешь?')

    this.shop.menu(form => {
      form
        .itemModifier(
          'Улучшить незеритовый меч до алмазного',
          new MultiCost().item(i.NetheriteIngot, 10).item(i.GoldIngot, 5).item(i.OakPlanks, 100).money(1000),
          item => item.typeId === i.DiamondSword,
          { rawtext: [{ translate: langKey({ typeId: i.DiamondSword }) }] },
          slot => this.upgradeDiamondSwordToNetherite(slot),
        )
        .section('Все для рейда', form => {
          form.itemStack(new ItemStack(i.Tnt, 10), new MoneyCost(300))
          form.itemStack(new ItemStack(i.Gunpowder, 10), new MoneyCost(100))
          form.itemStack(new ItemStack(i.TntMinecart, 1), new MoneyCost(400))
        })
    })
  }

  upgradeDiamondSwordToNetherite(slot: ContainerSlot) {
    const item = slot.getItem()
    if (!item) return

    const newitem = new ItemStack(i.NetheriteSword)
    copyAllItemPropertiesExceptEnchants(newitem, item)
    if (newitem.enchantable && item.enchantable) {
      newitem.enchantable.addEnchantments(item.enchantable.getEnchantments())
    }

    slot.setItem(newitem)
  }
}

const chances = []
