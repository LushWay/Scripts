import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { i18n, i18nShared } from 'lib/i18n/text'
import { customItems, CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { isNewbie } from 'lib/rpg/newbie'
import { Group } from 'lib/rpg/place'
import { Cost, ItemCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { CannonItem, CannonShellItem } from 'modules/pvp/cannon'
import { BaseItem } from '../base/base'
import { MagicSlimeBall } from '../village-of-explorers/items'

export const CircuitBoard = new ItemStack(Items.CircuitBoard).setInfo(
  undefined,
  i18n`Используется для создания базы у Инжинера в Технограде\n\nМожно получить из усиленного сундука и робота`,
)

export const Chip = new ItemStack(Items.Chip).setInfo(
  undefined,
  i18n`Используется для создания платы у Инжинера в Технограде`,
)
customItems.push(CircuitBoard, Chip)

export const NotNewbieCost = new (class NotNewbieCost extends Cost {
  toString(player: Player, canBuy?: boolean): string {
    return canBuy ? '' : i18n.error`Вы не можете купить это в режиме новичка`.to(player.lang)
  }

  has(player: Player): boolean {
    return !isNewbie(player)
  }

  failed(player: Player): string {
    return this.toString(player)
  }
})()

export class Engineer extends ShopNpc {
  constructor(public group: Group) {
    super(group.place('engineer').name(i18nShared`Инженер`))

    this.shop.body(
      () => i18n`Ну типа дай мне чертеж, a я те чета там наколупаю, да
`,
    )
    this.shop.menu(menu => {
      menu.itemStack(
        BaseItem.itemStack,
        new MultiCost(NotNewbieCost)
          .item(CircuitBoard)
          .item(MinecraftItemTypes.NetherStar)
          .item(BaseItem.blueprint)
          .item(MinecraftItemTypes.EnderPearl, 5)
          .item(MagicSlimeBall, 30)
          .money(4_000),
      )

      for (const [item, cost] of [
        [CannonItem, new MultiCost().item(Chip).money(200)],
        [CannonShellItem, new MultiCost().item(MinecraftItemTypes.Gunpowder, 20).money(100)],
      ] as [CustomItemWithBlueprint, Cost][]) {
        menu.itemStack(item.itemStack, new MultiCost(new ItemCost(item.blueprint), cost))
      }

      menu.itemStack(
        CircuitBoard,
        new MultiCost()
          .item(Chip)
          .item(MinecraftItemTypes.IronIngot, 20)
          .item(MinecraftItemTypes.GoldIngot, 10)
          .item(MinecraftItemTypes.Quartz, 10)
          .item(MinecraftItemTypes.CopperIngot, 10)
          .money(4500),
      )

      menu.section(i18n`Все для редстоуна`, menu => {
        menu.itemStack(new ItemStack(i.Slime), new MultiCost().money(5))
        menu.itemStack(new ItemStack(i.HoneyBlock), new MultiCost().money(10))
        menu.itemStack(new ItemStack(i.Piston), new MultiCost().money(8))
      })
    })
  }
}
