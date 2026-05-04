import { ContainerSlot, Enchantment, EnchantmentType, ItemStack, Player } from '@minecraft/server'
import {
  MinecraftEnchantmentTypes as e,
  MinecraftItemTypes as i,
  MinecraftBlockTypes,
  MinecraftEnchantmentTypes,
  MinecraftItemTypes,
  MinecraftPotionEffectTypes,
} from '@minecraft/vanilla-data'

import { Sounds } from 'lib/assets/custom-sounds'
import { Enchantments } from 'lib/enchantments'
import { EventSignal } from 'lib/event-signal'
import { getAuxOrTexture } from 'lib/form/chest'
import { translateEnchantment, translateTypeId } from 'lib/i18n/lang'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { Cost, MoneyCost, MultiCost } from 'lib/shop/cost'
import { ErrorCost, FreeCost } from 'lib/shop/cost/cost'
import { ShopFormSection } from 'lib/shop/form'
import { ShopNpc } from 'lib/shop/npc'
import { addNamespace, doNothing } from 'lib/util'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { FireBallItem } from 'modules/pvp/fireball'
import { IceBombItem } from 'modules/pvp/ice-bomb'
import { ItemAbility } from 'modules/pvp/item-ability'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'
import { enchantmentPrice } from './price'

export class Mage extends ShopNpc {
  // Used for learning quest
  onBuy = new EventSignal<{ player: Player }>()

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

          ench(e.Sharpness, (level, f) => new MultiCost().money(f(500, 100_000, 0.3)).xp(level * enchs))
          ench(e.Unbreaking, (level, f) => new MultiCost().money(f(1000, 10_000)).xp(level * enchs))
          ench(e.Looting, (level, f) => new MultiCost().money(f(1000, 20_000)).xp(level * enchs))
          ench(e.Knockback, (level, f) => new MultiCost().money(f(1000, 5_000)).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить лук`,
        item => item.typeId.endsWith('bow'),
        i18n`любой лук`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Power, (level, f) => new MultiCost().money(f(500, 500_000)).xp(level * enchs))
          ench(e.Unbreaking, (level, f) => new MultiCost().money(f(1000, 10_000)).xp(level * enchs))
          ench(e.BowInfinity, (level, f) => new MultiCost().money(10_000).xp(level * enchs))
          ench(e.Flame, (level, f) => new MultiCost().money(10_000).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить броню`,
        item => ['chestplate', 'leggings', 'boots', 'helmet'].some(e => item.typeId.endsWith(e)),
        i18n`любой элемент брони`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Protection, (level, f) => new MultiCost().money(f(100, 10_000)).xp(level * enchs))
          ench(e.Unbreaking, (level, f) => new MultiCost().money(f(1000, 10_000)).xp(level * enchs))
          ench(e.ProjectileProtection, (level, f) => new MultiCost().money(f(100, 5_000)).xp(level * enchs))
          ench(e.FireProtection, (level, f) => new MultiCost().money(f(100, 5_000)).xp(level * enchs))
          ench(e.BlastProtection, (level, f) => new MultiCost().money(f(100, 5_000)).xp(level * enchs))
          ench(e.Thorns, (level, f) => new MultiCost().money(f(100, 1_000)).xp(level * enchs))
          ench(e.SwiftSneak, (level, f) => new MultiCost().money(f(5_000, 10_000)).xp(level * enchs))
          ench(e.SoulSpeed, (level, f) => new MultiCost().money(f(5_000, 10_000)).xp(level * enchs))
          ench(e.FeatherFalling, (level, f) => new MultiCost().money(f(5_000, 10_000)).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        i18n`Улучшить инструмент`,
        item => ['shovel', 'pickaxe', 'axe', 'hoe'].some(e => item.typeId.endsWith(e)),
        i18n`любые топор, кирка, мотыга или лопата`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot, player)
          const levels = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Efficiency, (level, f) => new MultiCost().money(f(100, 250_000, 0.3)).xp(level * levels))
          ench(e.Unbreaking, (level, f) => new MultiCost().money(f(5_000, 10_000)).xp(level * levels))
          ench(e.Fortune, (level, f) => new MultiCost().money(f(10_000, 50_000)).xp(level * levels))
          ench(e.SilkTouch, _ => new MultiCost().money(3000).xp(levels * 10))
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
            form.potion(new MoneyCost(1000), MinecraftPotionEffectTypes.Strength)
            form.potion(new MoneyCost(1000), MinecraftPotionEffectTypes.Healing)
            form.potion(new MoneyCost(1000), MinecraftPotionEffectTypes.Swiftness)
            form.potion(new MoneyCost(10), MinecraftPotionEffectTypes.LongNightvision)
          })
          .itemStack(IceBombItem.itemStack, new MoneyCost(100))
          .itemStack(FireBallItem.itemStack, new MoneyCost(100))
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
    return (
      type: e,
      getCost: (
        currentLevel: number,
        formula: (minPrice: number, maxPrice: number, exponent?: number) => number,
      ) => Cost,
      up = 1,
    ) => {
      const result = this.updateEnchatnment(slot, type, up, true)

      form
        .product()
        .name(translateEnchantment(result.enchantment, player.lang))
        .cost(
          !result.can
            ? result.error
            : new MultiCost(
                getCost(result.level, (minPrice, maxPrice, offset) =>
                  enchantmentPrice({ minPrice, maxPrice, offset, level: result.level, maxLevel: result.maxLevel }),
                ),
              ).item(MinecraftItemTypes.LapisLazuli, result.level),
        )
        .onBuy(player => {
          this.updateEnchatnment(slot, type, up)
          player.playSound(Sounds.LevelUp)
          EventSignal.emit(this.onBuy, { player })
        })
    }
  }

  updateEnchatnment(
    slot: ContainerSlot | ItemStack,
    type: e,
    up = 1,
    check = false,
  ):
    | { can: false; error: Cost; enchantment: Enchantment }
    | { can: true; enchantment: Enchantment; level: number; maxLevel: number } {
    const item = slot instanceof ItemStack ? slot.clone() : slot.getItem()?.clone()
    const current = item?.enchantable?.getEnchantment(type)?.level ?? 0
    const level = current + up
    const enchantmentCurrent: Enchantment = { type: new EnchantmentType(type), level: current }
    const enchantment: Enchantment = { type: enchantmentCurrent.type, level }

    const custom = Enchantments.custom[type] ?? {}
    const maxLevel = Math.max(...Object.keys(custom).map(Number))

    if (!item?.enchantable) return { can: false, error: Incompatible, enchantment }

    if (level > enchantment.type.maxLevel) {
      const enchitem = custom[level]?.[item.typeId]

      // Max already
      if (!enchitem) return { can: false, error: MaxLevel, enchantment }

      if (check) return { can: true, level, enchantment, maxLevel }

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
        return { can: false, error: Incompatible, enchantment }
      }
      if (check) return { can: true, level, enchantment, maxLevel }
      if (slot instanceof ContainerSlot) slot.setItem(item)
    }

    return { can: false, error: Incompatible, enchantment }
  }
}

const LevelIsHigher = ErrorCost(i18n.error`Уровень зачара предмета уже выше книжки`)
const LevelIsSame = ErrorCost(i18n.error`Уровень зачара предмета как у книжки`)
const MaxLevel = ErrorCost(i18n.error`Максимальный уровень`)
const Incompatible = ErrorCost(i18n`§8Зачарование несовместимо`)
