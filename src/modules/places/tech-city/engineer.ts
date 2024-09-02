import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes as i, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { Items } from 'lib/assets/custom-items'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { Group } from 'lib/rpg/place'
import { Cost, ItemCost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { MaybeRawText, t } from 'lib/text'
import { CannonItem, CannonShellItem } from 'modules/features/cannon'
import { isNewbie } from 'modules/pvp/newbie'
import { BaseItem } from '../base/base'
import { MagicSlimeBall } from '../village-of-explorers/village-of-explorers'

export const CircuitBoard = new ItemStack(Items.CircuitBoard).setInfo(
  undefined,
  'Используется для создания базы у Инжинера в Технограде\n\nМожно получить из усиленного сундука и робота',
)

export const Chip = new ItemStack(Items.Chip).setInfo(
  undefined,
  'Используется для создания платы у Инжинера в Технограде',
)

class NotNewbieCost extends Cost {
  toString(canBuy?: boolean): MaybeRawText {
    return canBuy ? '' : t.error`Вы не можете купить это в режиме новичка`
  }

  has(player: Player): boolean {
    return !isNewbie(player)
  }

  failed(player: Player): MaybeRawText {
    return this.toString()
  }
}

export class Engineer extends ShopNpc {
  constructor(public group: Group) {
    super(group.point('engineer').name('Инжeнер'))

    this.shop.body(() => 'Ну типа дай мне чертеж, a я те чета там наколупаю, да\n')
    this.shop.menu(menu => {
      menu.itemStack(
        BaseItem.itemStack,
        new MultiCost(new NotNewbieCost())
          .item(CircuitBoard)
          .item(MinecraftItemTypes.NetherStar)
          .item(BaseItem.blueprint)
          .item(MinecraftItemTypes.EnderPearl, 5)
          .item(MagicSlimeBall, 30)
          .money(4_000),
      )

      for (const [item, cost] of [
        [CannonItem, new MultiCost().money(200)],
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
          .item(MinecraftItemTypes.CopperIngot, 10)
          .money(4500),
      )

      menu.section('Все для редстоуна', menu => {
        menu.itemStack(new ItemStack(i.Slime), new MultiCost().money(5))
        menu.itemStack(new ItemStack(i.HoneyBlock), new MultiCost().money(10))
        menu.itemStack(new ItemStack(i.Piston), new MultiCost().money(8))
      })
    })
  }
}
