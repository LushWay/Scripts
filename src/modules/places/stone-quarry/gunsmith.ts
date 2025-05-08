import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { langToken, selectByChance } from 'lib'
import { Group } from 'lib/rpg/place'
import { MultiCost } from 'lib/shop/cost'
import { ErrorCost } from 'lib/shop/cost/cost'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'
import { lockBlockPriorToNpc } from 'modules/survival/locked-features'
import { copyAllItemPropertiesExceptEnchants } from '../village-of-explorers/mage'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.point('gunsmith').name('Оружейник'))
    this.shop.body(() => 'Кую оружие. Если делать нечего, иди отсюда, не отвлекай дяденьку от работы.')

    lockBlockPriorToNpc(MinecraftBlockTypes.Anvil, this.place.name)
    lockBlockPriorToNpc(MinecraftBlockTypes.EnchantingTable, this.place.name)

    this.shop.menu((form, player) => {
      form
        .itemModifierSection(
          'Улучшить до незерита',
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
          'Алмазный предмет',
          (form, slot) => {
            form
              .product()
              .name('Улучшить')
              .cost(new MultiCost().item(i.NetheriteIngot, 1).money(1000))
              .onBuy(() => this.upgradeDiamondSwordToNetherite(slot, player))
          },
        )

        .itemModifierSection(
          'Починить',
          i => !!i.durability && i.durability.damage !== 0,
          'Любой поломанный предмет',
          (form, slot) => {
            const item = slot.getItem()
            if (!item?.durability) return false

            const enchantmentsLevels = item.enchantable?.getEnchantments().reduce((p, c) => p + c.level, 1) ?? 1
            const repairCost = ((item.durability.damage / 1000) * enchantmentsLevels) / 5
            console.log({ d: item.durability.damage / 1000, e: enchantmentsLevels / 5, cost: repairCost })
            const cost =
              item.durability.damage === 0
                ? ErrorCost(t.error`Предмет целый, выберите другой`)
                : new MultiCost().xp(repairCost)

            form
              .product()
              .name('Починить')
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
    let lost = false
    if (newitem.enchantable && item.enchantable) {
      for (const ench of item.enchantable.getEnchantments()) {
        if (!lost && selectByChance(looseEnchantment).item) {
          lost = true
          player.tell(
            t.warn
              .raw`Онет, кажется, зачарование ${{ translate: langToken(ench.type.id) }} уровнем ${ench.level.toString()}§e потерялось...`,
          )
          continue
        } else {
          newitem.enchantable.addEnchantment(ench)
        }
      }
    }
  }
}

const looseEnchantment = [
  {
    item: true,
    chance: 3,
  },
  {
    item: false,
    chance: 97,
  },
]
