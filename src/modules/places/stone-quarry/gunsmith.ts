import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { translateTypeId } from 'lib'
import { i18n, i18nShared } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { rollChance } from 'lib/rpg/random'
import { MultiCost } from 'lib/shop/cost'
import { ErrorCost } from 'lib/shop/cost/cost'
import { ShopNpc } from 'lib/shop/npc'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.place('gunsmith').name(i18nShared`Оружейник`))
    this.shop.body(() => i18n`Кую оружие. Если делать нечего, иди отсюда, не отвлекай дяденьку от работы.`)

    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.ChippedAnvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.DamagedAnvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)

    this.shop.menu((form, player) => {
      form
        .itemModifierSection(
          i18n`Улучшить до незерита`,
          item =>
            (
              [
                i.DiamondAxe,
                i.DiamondBoots,
                i.DiamondChestplate,
                i.DiamondHelmet,
                i.DiamondLeggings,
                i.DiamondPickaxe,
                i.DiamondSword,
              ] as string[]
            ).includes(item.typeId),
          i18n`Алмазный предмет`,
          (form, slot) => {
            form
              .product()
              .name(i18nShared`Улучшить`)
              .cost(new MultiCost().item(i.NetheriteIngot, 1).money(1000))
              .onBuy(() => this.upgradeDiamondSwordToNetherite(slot, player))
          },
        )

        .itemModifierSection(
          i18n`Починить`,
          i => !!i.durability && i.durability.damage !== 0,
          i18n`Любой поломанный предмет`,
          (form, slot) => {
            const item = slot.getItem()
            if (!item?.durability) return false

            const enchantmentsLevels = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
            const repairCost = ((item.durability.damage / 1000) * enchantmentsLevels) / 5

            let type = MinecraftItemTypes.Cobblestone
            let amount = 1
            let money = 1

            for (const [substr, itemType, itemAmount, itemMoney] of [
              ['iron', MinecraftItemTypes.IronIngot, 1, 10],
              ['gold', MinecraftItemTypes.GoldIngot, 1, 10],
              ['diamond', MinecraftItemTypes.Diamond, 2, 100],
              ['netherite', MinecraftItemTypes.NetheriteIngot, 1, 500],
            ] as const) {
              if (item.typeId.includes(substr)) {
                type = itemType
                money = itemMoney
                amount = itemAmount
              }
            }

            const cost =
              item.durability.damage === 0
                ? ErrorCost(i18n.error`Предмет целый, выберите другой`)
                : new MultiCost().xp(repairCost).item(type, amount).money(money)

            form
              .product()
              .name(i18nShared`Починить`)
              .cost(cost)
              .onBuy(() => {
                if (item.durability) item.durability.damage = 0
                const olditem = item.clone()
                item.enchantable?.removeAllEnchantments()
                this.copyEnchantments(item, olditem, player)
                slot.setItem(item)
              })
          },
        )
    })
  }

  upgradeDiamondSwordToNetherite(slot: ContainerSlot, player: Player) {
    const item = slot.getItem()
    if (!item) return

    const newitem = new ItemStack(item.typeId.replace('diamond', 'netherite'))
    copyAllItemPropertiesExceptEnchants(newitem, item)
    this.copyEnchantments(newitem, item, player)

    slot.setItem(newitem)
  }

  private copyEnchantments(newitem: ItemStack, item: ItemStack, player: Player) {
    // TODO Enchants above max level won't work here
    let lost = false
    if (newitem.enchantable && item.enchantable) {
      for (const ench of item.enchantable.getEnchantments()) {
        if (!lost && rollChance(3)) {
          lost = true
          player.warn(
            i18n.warn`Онет, кажется, зачарование ${translateTypeId(ench.type.id, player.lang)} уровнем ${ench.level.toString()} потерялось...`.to(
              player.lang,
            ),
          )
          continue
        } else {
          newitem.enchantable.addEnchantment(ench)
        }
      }
    }
  }
}
