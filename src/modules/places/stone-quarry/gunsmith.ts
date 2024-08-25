import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { langToken, selectByChance } from 'lib'
import { Group } from 'lib/rpg/place'
import { MoneyCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { t } from 'lib/text'
import { copyAllItemPropertiesExceptEnchants } from '../village-of-explorers/mage'

export class Gunsmith extends ShopNpc {
  constructor(group: Group) {
    super(group.point('gunsmith').name('Оружейник'))
    this.shop.body(() => 'Кую оружие. Если делать нечего, иди отсюда, не отвлекай дяденьку от работы.')

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
            form.product('Улучшить', new MultiCost().item(i.NetheriteIngot, 1).money(1000), () =>
              this.upgradeDiamondSwordToNetherite(slot, player),
            )
          },
        )
        .itemModifierSection(
          'Починить',
          i => !!i.durability && i.durability.damage !== 0,
          'Любой поломанный предмет',
          (form, slot) => {
            const item = slot.getItem()
            if (!item?.durability) return false

            form.product('Починить', new MultiCost().xp(item.durability.damage / 10), () => {
              if (item.durability) item.durability.damage = 0
              const olditem = item.clone()
              item.enchantable?.removeAllEnchantments()
              this.copyEnchantments(item, olditem, player)
              slot.setItem(item)
            })
          },
        )
        .section('Все для рейда', form => {
          form.itemStack(new ItemStack(i.Tnt, 10), new MoneyCost(300))
          form.itemStack(new ItemStack(i.Gunpowder, 10), new MoneyCost(100))
          form.itemStack(new ItemStack(i.TntMinecart, 1), new MoneyCost(400))
        })
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
    chance: 10,
  },
  {
    item: false,
    chance: 90,
  },
]
