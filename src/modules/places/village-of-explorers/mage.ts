import { ContainerSlot, Enchantment, EnchantmentType, ItemStack } from '@minecraft/server'
import {
  MinecraftEnchantmentTypes as e,
  MinecraftItemTypes as i,
  MinecraftBlockTypes,
  MinecraftEnchantmentTypes,
  MinecraftItemTypes,
  MinecraftPotionEffectTypes,
  MinecraftPotionModifierTypes,
} from '@minecraft/vanilla-data'
import { addNamespace, doNothing, Enchantments, getAuxOrTexture } from 'lib'
import { Sounds } from 'lib/assets/custom-sounds'
import { langToken, translateEnchantment } from 'lib/i18n/lang'
import { t } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { Cost, MoneyCost, MultiCost } from 'lib/shop/cost'
import { ErrorCost, FreeCost } from 'lib/shop/cost/cost'
import { ShopFormSection } from 'lib/shop/form'
import { ShopNpc } from 'lib/shop/npc'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { FireBallItem } from 'modules/pvp/fireball'
import { IceBombItem } from 'modules/pvp/ice-bomb'
import { ItemAbility } from 'modules/pvp/item-ability'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'

export class Mage extends ShopNpc {
  constructor(group: Group) {
    super(group.place('mage').name(t`Маг`))

    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)

    this.shop.body(() => t`Чего пожелаешь?`)
    this.shop.menu((form, player) => {
      form.itemModifierSection(
        t`Улучшить меч`,
        item => ['sword'].some(e => item.typeId.endsWith(e)),
        t`любой меч`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Sharpness, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 40).xp(level * enchs))
          ench(e.Looting, level => new MultiCost().money(level * 2000).xp(level * enchs))
          ench(e.Knockback, level => new MultiCost().money(level * 2000).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        t`Улучшить лук`,
        item => item.typeId.endsWith('bow'),
        t`любой лук`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Power, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 40).xp(level * enchs))
          ench(e.BowInfinity, level => new MultiCost().money(level * 2000).xp(level * enchs))
          ench(e.Flame, level => new MultiCost().money(level * 2000).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        t`Улучшить броню`,
        item => ['chestplate', 'leggings', 'boots', 'helmet'].some(e => item.typeId.endsWith(e)),
        t`любой элемент брони`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Protection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.ProjectileProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.FireProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.BlastProtection, level => new MultiCost().money(level * 20).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        t`Улучшить инструмент`,
        item => ['shovel', 'pickaxe', 'axe', 'hoe'].some(e => item.typeId.endsWith(e)),
        t`любые топор, кирка, мотыга или лопата`,
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Efficiency, level => new MultiCost().money(level * 10).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 10).xp(level * enchs))
          ench(e.SilkTouch, _ => new MultiCost().money(20000).xp(50))
        },
      )

      form.itemModifierSection(
        t`Использовать книгу чар`,
        item => item.typeId === MinecraftItemTypes.EnchantedBook,
        { rawtext: [{ translate: langToken(MinecraftItemTypes.EnchantedBook) }] },
        (bookForm, book, bookItem) => {
          const bookEnch = bookItem.enchantable?.getEnchantments()[0]
          const type = Object.values(MinecraftEnchantmentTypes).find(e => e === bookEnch?.type.id)
          if (!bookEnch || !type)
            return bookForm
              .product()
              .name(t`Нет зачарований`)
              .cost(Incompatible)
              .onBuy(doNothing)

          bookForm.itemModifierSection(
            t`Предмет`,
            item => item.typeId !== MinecraftItemTypes.EnchantedBook && this.updateEnchatnment(item, type, 1, true).can,
            t`Предмет для зачарования`,
            (itemForm, target, targetItem, _, addSelectItem) => {
              const enchs = targetItem.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
              const level = targetItem.enchantable?.getEnchantment(new EnchantmentType(type))?.level ?? 0

              itemForm
                .product()
                .name(t.raw`§r§7Выбранная книга: ${translateEnchantment(bookEnch)}`)
                .cost(FreeCost)
                .onBuy(() => bookForm.show())
                .setTexture(getAuxOrTexture(MinecraftItemTypes.EnchantedBook))

              addSelectItem()

              itemForm
                .product()
                .name(t`Зачаровать`)
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

      form.section(t`Оружие со способностями`, (form, player) => {
        const cost = new MultiCost().item(i.DiamondSword).item(i.LapisLazuli, 100).item(i.Redstone, 100).money(10000)
        form
          .product()
          .name(t.nocolor`§r§fМеч со способностью §7${ItemAbility.names[ItemAbility.Ability.Vampire]}`)
          .cost(cost)
          .onBuy(player => {
            if (!player.container) return

            cost.take(player)
            player.container.addItem(
              ItemAbility.schema.create({ ability: ItemAbility.Ability.Vampire }, i.DiamondSword).item,
            )
          })
      })

      form.section(t`Все для магии`, form =>
        form
          .section(t`Грибы`, form =>
            form
              .itemStack(new ItemStack(i.MushroomStew), new MoneyCost(200))
              .itemStack(new ItemStack(i.RedMushroom), new MoneyCost(200)),
          )
          .section(t`Зелья`, form => {
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
        t`Отсортировать чарки`,
        FreeCost,
        item => !!item.enchantable,
        t`любой зачарованный предмет`,
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
            if (ench.level > ench.type.maxLevel) return player.fail(t`С чарками такого уровня не работаю, слетят`)

            item.enchantable.removeEnchantment(ench.type)
            item.enchantable.addEnchantment(ench)
          }

          slot.setItem(item)
        },
      )
    })
  }

  createEnch(form: ShopFormSection, _: ItemStack, slot: ContainerSlot) {
    return (type: e, getCost: (currentLevel: number) => Cost, up = 1) => {
      const { can, level, enchantment } = this.updateEnchatnment(slot, type, up, true)

      form
        .product()
        .name({ rawtext: [{ text: can ? '' : '§7' }, ...(translateEnchantment(enchantment).rawtext ?? [])] })
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
    const enchantment: Enchantment = { type: new EnchantmentType(type), level: current }

    if (item?.enchantable) {
      const { maxLevel: max } = enchantment.type
      const level = current + up

      if (level > max) {
        const enchitem = Enchantments.custom[type]?.[current + 1]?.[item.typeId]
        if (!enchitem) return { can: false, level: 0, enchantment }

        enchantment.level = level
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
          return { can: false, level: -1, enchantment }
        }
        enchantment.level = level
        if (check) return { can: true, level, enchantment }
        if (slot instanceof ContainerSlot) slot.setItem(item)
      }
    }

    return { can: false, level: 0, enchantment }
  }
}

const LevelIsHigher = ErrorCost(t.error`Уровень зачара предмета уже выше книжки`)
const LevelIsSame = ErrorCost(t.error`Уровень зачара предмета как у книжки`)
const MaxLevel = ErrorCost(t.error`Максимальный уровень`)
const Incompatible = ErrorCost(t`§8Зачарование несовместимо`)
