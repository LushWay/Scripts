import { ContainerSlot, EnchantmentType, ItemStack } from '@minecraft/server'
import { MinecraftEnchantmentTypes as e, MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.point('gunsmith').name('Оружейник'))
    this.shop.body(() => 'Чего пожелаешь?')

    this.shop.menu(form => {
      form
        .addItemModifier(
          'Улучшить незеритовый меч до алмазного',
          new MultiCost().item(i.NetheriteIngot, 10).item(i.GoldIngot, 5).item(i.OakPlanks, 100).money(1000),
          item => item.typeId === i.DiamondSword,
          slot => this.upgradeDiamondSwordToNetherite(slot),
        )
        .addSection('Броня', form => {
          form.addItemModifier(
            'Улучшить защиту',
            new MultiCost().item(i.LapisLazuli, 3).money(10),
            item => item.typeId.endsWith('chestplate'),
            slot => this.updateEnchatnment(slot, e.Protection, 1),
          )
        })
        .addSection('Все для рейда', form => {
          form.addItemStack(new ItemStack(i.Tnt, 10), new MoneyCost(300))
          form.addItemStack(new ItemStack(i.Gunpowder, 10), new MoneyCost(100))
          form.addItemStack(new ItemStack(i.TntMinecart, 1), new MoneyCost(400))
        })
    })
  }

  updateEnchatnment(slot: ContainerSlot, type: e, level = 1) {
    const item = slot.getItem()
    if (item?.enchantable) {
      item.enchantable.addEnchantment({
        type: new EnchantmentType(type),
        level: (item.enchantable.getEnchantment(type)?.level ?? 0) + level,
      })
      slot.setItem(item)
    }
  }

  upgradeDiamondSwordToNetherite(slot: ContainerSlot) {
    const slotItem = slot.getItem()
    if (!slotItem) return
    const item = new ItemStack(i.NetheriteSword)
    item.setLore(slot.getLore())

    if (item.enchantable && slotItem.enchantable)
      item.enchantable.addEnchantments(slotItem.enchantable.getEnchantments())

    if (item.durability && slotItem.durability) item.durability.damage = slotItem.durability.damage
    slot.setItem(item)
  }
}
