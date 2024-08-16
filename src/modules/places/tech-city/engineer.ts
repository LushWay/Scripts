import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes, MinecraftItemTypes as i } from '@minecraft/vanilla-data'
import { CustomItemWithBlueprint } from 'lib/rpg/custom-item'
import { Group } from 'lib/rpg/place'
import { Cost, MultiCost } from 'lib/shop/cost'
import { ShopNpc } from 'lib/shop/npc'
import { MaybeRawText, t } from 'lib/text'
import { CannonBulletItem, CannonItem } from 'modules/features/cannon'
import { isNewbie } from 'modules/pvp/newbie'
import { BaseItem } from '../base/base'

export const MicroSchema = new ItemStack(MinecraftItemTypes.IronIngot).setInfo('Микросхема', 'Нужная фигня, да')

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
      function addItem(item: CustomItemWithBlueprint, cost: Cost) {
        menu.itemStack(item.itemStack, new MultiCost(cost).item(item.blueprint))
      }

      addItem(BaseItem, new MultiCost(new NotNewbieCost()).money(1000))
      addItem(CannonItem, new MultiCost().money(200))
      addItem(CannonBulletItem, new MultiCost().money(100).item(new ItemStack(i.SlimeBall)))

      menu.section('Все для редстоуна', menu => {
        menu.itemStack(new ItemStack(i.Slime), new MultiCost().money(5))
        menu.itemStack(new ItemStack(i.HoneyBlock), new MultiCost().money(10))
        menu.itemStack(new ItemStack(i.Piston), new MultiCost().money(8))
      })
    })
  }
}
