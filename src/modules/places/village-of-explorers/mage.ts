import { ContainerSlot, EnchantmentType, ItemStack } from '@minecraft/server'
import {
  MinecraftEnchantmentTypes as e,
  MinecraftItemTypes as i,
  MinecraftBlockTypes,
  MinecraftEnchantmentTypes,
  MinecraftItemTypes,
} from '@minecraft/vanilla-data'
import { Enchantments, getAuxOrTexture, isKeyof } from 'lib'
import { Sounds } from 'lib/assets/config'
import { Group } from 'lib/rpg/place'
import { Cost, MoneyCost, MultiCost } from 'lib/shop/cost'
import { ErrorCost, FreeCost } from 'lib/shop/cost/cost'
import { ShopFormSection } from 'lib/shop/form'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'
import { langToken, translateEnchantment } from 'lib/utils/lang'
import { FireBallItem, IceBombItem } from 'modules/pvp/fireball-and-ice-bomb'
import { ItemAbility } from 'modules/pvp/item-ability'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'

export class Mage extends ShopNpc {
  constructor(group: Group) {
    super(group.point('mage').name('Маг'))

    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)

    this.shop.body(() => 'Чего пожелаешь?')
    this.shop.menu((form, player) => {
      form.itemModifierSection(
        'Улучшить меч',
        item => ['sword'].some(e => item.typeId.endsWith(e)),
        'любой меч',
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Sharpness, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.FireAspect, level => new MultiCost().money(level * 2000).xp(level * enchs))
          ench(e.Looting, level => new MultiCost().money(level * 2000).xp(level * enchs))
          ench(e.Knockback, level => new MultiCost().money(level * 2000).xp(level * enchs))
        },
      )

      form.itemModifierSection(
        'Улучшить броню',
        item => ['chestplate', 'leggings', 'boots', 'helmet'].some(e => item.typeId.endsWith(e)),
        'любой элемент брони',
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
        'Улучшить инструмент',
        item => ['shovel', 'pickaxe', 'axe', 'hoe'].some(e => item.typeId.endsWith(e)),
        'любые топор, кирка, мотыга или лопата',
        (form, slot, item) => {
          const ench = this.createEnch(form, item, slot)
          const enchs = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1

          ench(e.Efficiency, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.Unbreaking, level => new MultiCost().money(level * 20).xp(level * enchs))
          ench(e.SilkTouch, _ => new MultiCost().money(20000).xp(100))
        },
      )

      form.itemModifierSection(
        'Использовать книгу чар',
        item => item.typeId === MinecraftItemTypes.EnchantedBook,
        { rawtext: [{ translate: langToken(MinecraftItemTypes.EnchantedBook) }] },
        (bookForm, book, bookItem) => {
          const bookEnch = bookItem.enchantable?.getEnchantments()[0]
          const type = Object.values(MinecraftEnchantmentTypes).find(e => e === bookEnch?.type.id)
          if (!bookEnch || !type)
            return bookForm.product('Нет зачарований', Incompatible, () => {
              return
            })

          bookForm.itemModifierSection(
            'Предмет',
            item => item.typeId !== MinecraftItemTypes.EnchantedBook && this.updateEnchatnment(item, type, 1, true).can,
            'Предмет для зачарования',
            (itemForm, target, targetItem, _, addSelectItem) => {
              const enchs = targetItem.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
              const level = targetItem.enchantable?.getEnchantment(new EnchantmentType(type))?.level ?? 0

              itemForm.product(
                t.raw`§r§7Выбранная книга: ${translateEnchantment(bookEnch)}`,
                FreeCost,
                () => bookForm.show(),
                getAuxOrTexture(MinecraftItemTypes.EnchantedBook),
              )

              addSelectItem()

              itemForm.product(
                t.raw`Зачаровать`,
                level >= bookEnch.level
                  ? level === bookEnch.level
                    ? LevelIsSame
                    : LevelIsHigher
                  : new MultiCost().money(1000).xp(~~((bookEnch.level * enchs) / 2)),
                (_, __, _s, text) => {
                  book.setItem(undefined)
                  this.updateEnchatnment(target, type, bookEnch.level - level)
                  form.show(text)
                  return false
                },
              )
            },
            true,
          )
        },
      )

      form.section('Оружие со способностями', (form, player) => {
        const cost = new MultiCost().item(i.DiamondSword).item(i.LapisLazuli, 100).item(i.Redstone, 100).money(10000)
        form.product(`§r§fМеч со способностью §7${ItemAbility.names[ItemAbility.Ability.Vampire]}`, cost, player => {
          if (!player.container) return

          cost.buy(player)
          player.container.addItem(
            ItemAbility.schema.create({ ability: ItemAbility.Ability.Vampire }, i.DiamondSword).item,
          )
        })
      })

      form.section('Все для магии', form =>
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

      form.itemModifier(
        'Отсортировать чарки',
        FreeCost,
        item => !!item.enchantable,
        'любой зачарованный предмет',
        (slot, item) => {
          if (!item.enchantable) return
          const prior = [
            MinecraftEnchantmentTypes.Sharpness,
            MinecraftEnchantmentTypes.Efficiency,
            MinecraftEnchantmentTypes.Power,
            MinecraftEnchantmentTypes.Protection,
          ]
          for (const p of prior) {
            const ench = item.enchantable.getEnchantment(p)
            if (!ench) continue
            if (ench.level > ench.type.maxLevel) return player.fail('С чарками такого уровня не работаю, слетят')

            item.enchantable.removeEnchantment(ench.type)
            item.enchantable.addEnchantment(ench)
          }

          slot.setItem(item)
        },
      )
    })
  }

  createEnch(form: ShopFormSection, item: ItemStack, slot: ContainerSlot) {
    return (type: e, getCost: (currentLevel: number) => Cost, up = 1) => {
      const { can, level } = this.updateEnchatnment(slot, type, up, true)
      form.product(
        { rawtext: [{ text: `${can ? '' : '§7'}+` }, ...(translateEnchantment(type).rawtext ?? [])] },
        can
          ? new MultiCost(getCost(level)).item(MinecraftItemTypes.LapisLazuli, level)
          : level === -1
            ? Incompatible
            : MaxLevel,
        player => {
          this.updateEnchatnment(slot, type, up)
          player.playSound(Sounds.LevelUp)
        },
      )
    }
  }

  updateEnchatnment(slot: ContainerSlot | ItemStack, type: e, up = 1, check = false): { can: boolean; level: number } {
    const item = slot instanceof ItemStack ? slot.clone() : slot.getItem()?.clone()
    const cant = { can: false, level: 0 }

    if (item?.enchantable) {
      const { maxLevel: max } = new EnchantmentType(type)
      const current = item.enchantable.getEnchantment(type)?.level ?? 0
      const level = current + up

      if (level > max) {
        const levels = Enchantments.typed[type]
        if (typeof levels === 'undefined') return cant

        const items = levels[current + 1]
        if (typeof items === 'undefined') return cant

        const enchitem = isKeyof(item.typeId, items) ? items[item.typeId] : undefined
        if (!enchitem) return cant

        if (check) return { can: true, level }
        const newitem = enchitem.clone()
        newitem.enchantable?.addEnchantments(item.enchantable.getEnchantments().filter(e => e.type.id !== type))

        copyAllItemPropertiesExceptEnchants(item, newitem)
        if (slot instanceof ContainerSlot) slot.setItem(newitem)
      } else {
        try {
          item.enchantable.addEnchantment({ type: new EnchantmentType(type), level })
        } catch (e) {
          return { can: false, level: -1 }
        }
        if (check) return { can: true, level }
        if (slot instanceof ContainerSlot) slot.setItem(item)
      }
    }
    return cant
  }
}

const LevelIsHigher = ErrorCost(t.error`Уровень зачара предмета уже выше книжки`)
const LevelIsSame = ErrorCost(t.error`Уровень зачара предмета как у книжки`)
const MaxLevel = ErrorCost(t.error`Максимальный уровень`)
const Incompatible = ErrorCost(t`§8Зачарование несовместимо`)

export function copyAllItemPropertiesExceptEnchants(item: ItemStack, newitem: ItemStack) {
  newitem.nameTag = item.nameTag
  newitem.amount = item.amount
  if (newitem.durability && item.durability) newitem.durability.damage = item.durability.damage
  newitem.setLore(item.getLore())
  newitem.setCanDestroy(item.getCanDestroy())
  newitem.setCanPlaceOn(item.getCanPlaceOn())
  newitem.keepOnDeath = item.keepOnDeath
  newitem.lockMode = item.lockMode
  for (const prop of item.getDynamicPropertyIds()) newitem.setDynamicProperty(prop, item.getDynamicProperty(prop))
}
