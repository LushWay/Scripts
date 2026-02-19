import { ContainerSlot, Enchantment, EnchantmentType, ItemStack, Player } from '@minecraft/server'
import {
  MinecraftEnchantmentTypes as e,
  MinecraftItemTypes as i,
  MinecraftBlockTypes,
  MinecraftEnchantmentTypes,
  MinecraftItemTypes,
  MinecraftPotionEffectTypes,
  MinecraftPotionModifierTypes,
} from '@minecraft/vanilla-data'

import { Sounds } from 'lib/assets/custom-sounds'
import { Enchantments } from 'lib/enchantments'
import { getAuxOrTexture } from 'lib/form/chest'
import { translateEnchantment, translateTypeId } from 'lib/i18n/lang'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { Cost, MoneyCost, MultiCost } from 'lib/shop/cost'
import { ErrorCost, FreeCost } from 'lib/shop/cost/cost'
import { ShopFormSection } from 'lib/shop/form'
import { ShopNpc } from 'lib/shop/npc'
import { addNamespace } from 'lib/util'
import { doNothing } from 'lib/util'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { FireBallItem } from 'modules/pvp/fireball'
import { IceBombItem } from 'modules/pvp/ice-bomb'
import { ItemAbility } from 'modules/pvp/item-ability'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'

export class Mage extends ShopNpc {
  constructor(group: Group) {
    super(group.place('mage').name(i18nShared`Маг`))

    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.ChippedAnvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.DamagedAnvil, this.place.name)

    this.shop.body(() => i18n`Чего пожелаешь?`)
    this.shop.menu((form, player) => {
      form.itemModifierSection(
        i18n`Улучшить меч`,
        item => ['sword'].some(e => item.typeId.endsWith(e)),
        i18n`любой меч`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Sharpness, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 40).xp(level * enchs))
          ench(e.Looting, level => new MultiCost().money(level * 300).xp(level * enchs))
          ench(e.Knockback, level => new MultiCost().money(level * 200).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить лук`,
        item => item.typeId.endsWith('bow'),
        i18n`любой лук`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Power, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 40).xp(level * enchs))
          ench(e.BowInfinity, level => new MultiCost().money(level * 2000).xp(level * enchs))
          ench(e.Flame, level => new MultiCost().money(level * 2000).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить броню`,
        item => ['chestplate', 'leggings', 'boots', 'helmet'].some(e => item.typeId.endsWith(e)),
        i18n`любой элемент брони`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Protection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 30).xp(level * enchs))
          ench(e.ProjectileProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.FireProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.BlastProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить инструмент`,
        item => ['shovel', 'pickaxe', 'axe', 'hoe'].some(e => item.typeId.endsWith(e)),
        i18n`любые топор, кирка, мотыга или лопата`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Efficiency, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 30).xp(level * enchs))
          ench(e.Fortune, level => new MultiCost().money(level * 200).xp(level * enchs))
          ench(e.SilkTouch, _ => new MultiCost().money(3000).xp(50))
        },
      )

      form.itemModifierSection(
        i18n`Использовать книгу чар`,
        item => item.typeId === MinecraftItemTypes.EnchantedBook,
        translateTypeId(MinecraftItemTypes.EnchantedBook, player.lang),
        (bookForm, book, bookItem) => {
          const bookEnch = bookItem.enchantable?.getEnchantments()[0]
          const type = Object.values(MinecraftEnchantmentTypes).find(e => e === bookEnch?.type.id)
          if (!bookEnch || !type)
            return bookForm
              .product()
              .name(i18nShared`Нет зачарований`)
              .cost(Incompatible)
              .onBuy(doNothing)

          bookForm.itemModifierSection(
            i18n`Предмет`,
            item => item.typeId !== MinecraftItemTypes.EnchantedBook && this.updateEnchatnment(item, type, 1, true).can,
            i18n`Предмет для зачарования`,
            (itemForm, target, targetItem, _, addSelectItem) => {
              const enchs = targetItem.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
              const level = targetItem.enchantable?.getEnchantment(new EnchantmentType(type))?.level ?? 0

              itemForm
                .product()
                .name(i18nShared`Выбранная книга: ${translateEnchantment(bookEnch, player.lang)}`)
                .cost(FreeCost)
                .onBuy(() => bookForm.show())
                .setTexture(getAuxOrTexture(MinecraftItemTypes.EnchantedBook))

              addSelectItem()

              itemForm
                .product()
                .name(i18nShared`Зачаровать`)
                .cost(
                  level >= bookEnch.level
                    ? level === bookEnch.level
                      ? LevelIsSame
                      : LevelIsHigher
                    : new MultiCost().money(1000).xp(~~((bookEnch.level * enchs) / 2)),
                )
                .onBuy((_, __, _s, text) => {
                  book.setItem(undefined)
                  this.updateEnchatnment(target, type, bookEnch.level - level)
                  form.show(text)
                  return false
                })
            },
            true,
          )
        },
      )

      form.section(i18n`Оружие со способностями`, (form, player) => {
        const cost = new MultiCost().item(i.DiamondSword).item(i.LapisLazuli, 100).item(i.Redstone, 100).money(10000)
        form
          .product()
          .name(i18nShared.nocolor`§r§fМеч со способностью §7${ItemAbility.names[ItemAbility.Ability.Vampire]}`)
          .cost(cost)
          .onBuy(player => {
            if (!player.container) return

            cost.take(player)
            player.container.addItem(
              ItemAbility.schema.create(player.lang, { ability: ItemAbility.Ability.Vampire }, i.DiamondSword).item,
            )
          })
          .setTakeCost(false)
      })

      form.section(i18n`Все для магии`, form =>
        form
          .section(i18n`Грибы`, form =>
            form
              .itemStack(new ItemStack(i.MushroomStew), new MoneyCost(200))
              .itemStack(new ItemStack(i.RedMushroom), new MoneyCost(200)),
          )
          .section(i18n`Зелья`, form => {
            form.potion(new MoneyCost(100), MinecraftPotionEffectTypes.Strength)
            form.potion(new MoneyCost(100), MinecraftPotionEffectTypes.Healing)
            form.potion(new MoneyCost(100), MinecraftPotionEffectTypes.Swiftness)
            form.potion(new MoneyCost(10), MinecraftPotionEffectTypes.NightVision, MinecraftPotionModifierTypes.Long)
          })
          .itemStack(IceBombItem, new MoneyCost(100))
          .itemStack(FireBallItem, new MoneyCost(100))
          .itemStack(new ItemStack(i.TotemOfUndying), new MultiCost().money(6_000).item(i.Emerald, 1))
          .itemStack(new ItemStack(i.EnchantedGoldenApple), new MultiCost().item(i.GoldenApple).money(10_000)),
      )

      form.itemModifier(
        i18n`Отсортировать чарки`,
        FreeCost,
        item => !!item.enchantable,
        i18n`любой зачарованный предмет`,
        (slot, item) => {
          if (!item.enchantable) return
          const prior = [
            MinecraftEnchantmentTypes.Sharpness,
            MinecraftEnchantmentTypes.Efficiency,
            MinecraftEnchantmentTypes.Power,
            MinecraftEnchantmentTypes.Protection,
          ].reverse()
          for (const p of prior) {
            const ench = item.enchantable.getEnchantment(p)
            if (!ench) continue
            if (ench.level > ench.type.maxLevel) return player.fail(i18n`С чарками такого уровня не работаю, слетят`)

            item.enchantable.removeEnchantment(ench.type)
            item.enchantable.addEnchantment(ench)
          }

          slot.setItem(item)
        },
      )
    })
  }

  createEnch(form: ShopFormSection, _: ItemStack, slot: ContainerSlot, player: Player) {
    return (type: e, getCost: (currentLevel: number) => Cost, up = 1) => {
      const { can, level, enchantment } = this.updateEnchatnment(slot, type, up, true)

      form
        .product()
        .name(translateEnchantment(enchantment, player.lang))
        .cost(
          can
            ? new MultiCost(getCost(level)).item(MinecraftItemTypes.LapisLazuli, level)
            : level === -1
              ? Incompatible
              : MaxLevel,
        )
        .onBuy(player => {
          this.updateEnchatnment(slot, type, up)
          player.playSound(Sounds.LevelUp)
        })
    }
  }

  updateEnchatnment(
    slot: ContainerSlot | ItemStack,
    type: e,
    up = 1,
    check = false,
  ): { can: boolean; level: number; enchantment: Enchantment } {
    const item = slot instanceof ItemStack ? slot.clone() : slot.getItem()?.clone()
    const current = item?.enchantable?.getEnchantment(type)?.level ?? 0
    const level = current + up
    const enchantmentCurrent: Enchantment = { type: new EnchantmentType(type), level: current }
    const enchantment: Enchantment = { type: enchantmentCurrent.type, level }

    if (item?.enchantable) {
      const { maxLevel: max } = enchantment.type

      if (level > max) {
        const enchitem = Enchantments.custom[type]?.[level]?.[item.typeId]
        if (!enchitem) return { can: false, level: 0, enchantment: enchantmentCurrent }

        if (check) return { can: true, level, enchantment }

        const newitem = enchitem.clone()
        newitem.enchantable?.addEnchantments(
          item.enchantable.getEnchantments().filter(e => addNamespace(e.type.id) !== type),
        )
        copyAllItemPropertiesExceptEnchants(item, newitem)
        if (slot instanceof ContainerSlot) slot.setItem(newitem)
      } else {
        try {
          item.enchantable.addEnchantment(enchantment)
        } catch (e) {
          return { can: false, level: -1, enchantment: enchantmentCurrent }
        }
        if (check) return { can: true, level, enchantment }
        if (slot instanceof ContainerSlot) slot.setItem(item)
      }
    }

    return { can: false, level: 0, enchantment: enchantmentCurrent }
  }
}

const LevelIsHigher = ErrorCost(i18n.error`Уровень зачара предмета уже выше книжки`)
const LevelIsSame = ErrorCost(i18n.error`Уровень зачара предмета как у книжки`)
const MaxLevel = ErrorCost(i18n.error`Максимальный уровень`)
const Incompatible = ErrorCost(i18n`§8Зачарование несовместимо`)
