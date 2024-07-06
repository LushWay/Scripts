import { ContainerSlot, EnchantmentType, ItemStack } from '@minecraft/server'
import { MinecraftEnchantmentTypes as e, MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { Group } from 'lib/rpg/place'
import { MoneyCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { FireBallItem, IceBombItem } from 'modules/pvp/fireball-and-ice-bomb'

export class Mage extends ShopNpc {
  constructor(group: Group) {
    super(group.point('mage').name('Маг'))

    this.shop.body(() => 'Чего пожелаешь?')
    this.shop.menu(form => {
      form
        .addSection('Улучшить оружие', form => {
          form.addItemModifier(
            'Улучшить остроту',
            new MultiCost().item(i.LapisLazuli, 3).money(10),
            item => item.typeId.endsWith('sword'),
            slot => this.updateEnchatnment(slot, e.Sharpness, 1),
          )
        })
        .addSection('Улучшить броню', form => {
          form.addItemModifier(
            'Улучшить защиту',
            new MultiCost().item(i.LapisLazuli, 3).money(10),
            item => item.typeId.endsWith('chestplate'),
            slot => this.updateEnchatnment(slot, e.Protection, 1),
          )
        })
        .addSection('Все для магии', form => {
          form.addSection('Грибы', form => {
            form.addItemStack(new ItemStack(i.MushroomStew), new MoneyCost(200))
            form.addItemStack(new ItemStack(i.RedMushroom), new MoneyCost(200))
          })
          form.addSection('Зелья', form => {
            form.addItemStack(new ItemStack(i.SplashPotion), new MoneyCost(10))
          })
          form.addItemStack(IceBombItem, new MoneyCost(100))
          form.addItemStack(FireBallItem, new MoneyCost(100))
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
}
