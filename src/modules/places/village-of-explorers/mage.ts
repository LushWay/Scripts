import { ContainerSlot, EnchantmentType, ItemStack } from '@minecraft/server'
import { MinecraftEnchantmentTypes as e, MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { ActionForm, getAuxOrTexture } from 'lib'
import { Group } from 'lib/rpg/place'
import { FreeCost, MoneyCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { itemDescription } from 'lib/shop/rewards'
import { FireBallItem, IceBombItem } from 'modules/pvp/fireball-and-ice-bomb'
import { ItemAbility } from 'modules/pvp/item-ability'

export class Mage extends ShopNpc {
  constructor(group: Group) {
    super(group.point('mage').name('Маг'))

    this.shop.body(() => 'Чего пожелаешь?')
    this.shop.menu(form => {
      form
        .section('Улучшить/купить оружие', (form, player) => {
          form.itemModifier(
            'Улучшить остроту меча',
            FreeCost,
            item => item.typeId.endsWith('sword'),
            slot => {
              const item = slot.getItem()
              if (!item) return

              const subform = new ActionForm('Туы')
                .addButtonBack(form.show)
                .addButton(
                  itemDescription(item),
                  getAuxOrTexture(item.typeId, !!item.enchantable?.getEnchantments().length),
                  () => subform.show(player),
                )
                .addButton('Ффф', () => {
                  this.updateEnchatnment(slot, e.Sharpness, 1)
                })

              subform.show(player)
            },
          )
          form.product(
            `§r§fМеч со способностью §7${ItemAbility.names[ItemAbility.Ability.Vampire]}`,
            new MultiCost().item(i.DiamondSword).item(i.LapisLazuli, 100).item(i.Redstone, 100).money(10_000),
            player => {
              player.container?.addItem(
                ItemAbility.schema.create({ ability: ItemAbility.Ability.Vampire }, i.DiamondSword).item,
              )
            },
          )
        })
        // .section('Улучшить броню', form => {
        //   form.itemModifierSection(
        //     '+Защита',
        //     item => item.typeId.endsWith('chestplate'),
        //     'Броня',
        //     form => {},
        //   )
        //   form.itemModifier(
        //     'Улучшить защиту',
        //     new MultiCost().item(i.LapisLazuli, 3).money(10),
        //     item => item.typeId.endsWith('chestplate'),
        //     slot => this.updateEnchatnment(slot, e.Protection, 1),
        //   )
        // })
        .itemModifierSection(
          'Улучшить броню',
          item => item.typeId.endsWith('chestplate'),
          'любой элемент брони',
          (form, slot) => {
            form.product('+Защита', new MultiCost().money(1), (player, text, success) => {
              this.updateEnchatnment(slot, e.Protection, 1)
              success()
            })
          },
        )
        .section('Все для магии', form =>
          form
            .section('Грибы', form =>
              form
                .itemStack(new ItemStack(i.MushroomStew), new MoneyCost(200))
                .itemStack(new ItemStack(i.RedMushroom), new MoneyCost(200)),
            )

            // TODO Potion API
            // Пока нет PotionAPI или сгенереных предметов не трогаем

            // .addSection('Зелья', form => {
            //   form.addItemStack(new ItemStack(i.SplashPotion), new MoneyCost(10))
            // })
            .itemStack(IceBombItem, new MoneyCost(100))
            .itemStack(FireBallItem, new MoneyCost(100))
            .itemStack(new ItemStack(i.TotemOfUndying), new MultiCost().money(6_000).item(i.Emerald, 1))
            .itemStack(new ItemStack(i.EnchantedGoldenApple), new MultiCost().item(i.GoldenApple).money(10_000)),
        )
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
