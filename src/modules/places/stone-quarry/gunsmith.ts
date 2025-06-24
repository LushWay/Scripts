import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { langToken } from 'lib'
import { t } from 'lib/i18n/text'
import { Group } from 'lib/rpg/place'
import { rollChance } from 'lib/rpg/random'
import { MultiCost } from 'lib/shop/cost'
import { ErrorCost } from 'lib/shop/cost/cost'
import { ShopNpc } from 'lib/shop/npc'
import { copyAllItemPropertiesExceptEnchants } from 'lib/utils/game'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.place('gunsmith').name(t`Оружейник`))
    this.shop.body(() => t`Кую оружие. Если делать нечего, иди отсюда, не отвлекай дяденьку от работы.`)

    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)

    this.shop.menu((form, player) => {
      form
        .itemModifierSection(
          t`Улучшить до незерита`,
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
          t`Алмазный предмет`,
          (form, slot) => {
            form
              .product()
              .name(t`Улучшить`)
              .cost(new MultiCost().item(i.NetheriteIngot, 1).money(1000))
              .onBuy(() => this.upgradeDiamondSwordToNetherite(slot, player))
          },
        )

        .itemModifierSection(
          t`Починить`,
          i => !!i.durability && i.durability.damage !== 0,
          t`Любой поломанный предмет`,
          (form, slot) => {
            const item = slot.getItem()
            if (!item?.durability) return false

            const enchantmentsLevels = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
            const repairCost = ((item.durability.damage / 1000) * enchantmentsLevels) / 5
            const cost =
              item.durability.damage === 0
                ? ErrorCost(t.error`Предмет целый, выберите другой`)
                : new MultiCost().xp(repairCost)

            form
              .product()
              .name(t`Починить`)
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
          player.tell(
            t.warn
              .raw`Онет, кажется, зачарование ${{ string: langToken(ench.type.id) }} уровнем ${ench.level.toString()}§e потерялось...`,
          )
          continue
        } else {
          newitem.enchantable.addEnchantment(ench)
        }
      }
    }
  }
}
