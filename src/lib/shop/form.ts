import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { ActionForm } from 'lib/form/action'
import { ChestForm } from 'lib/form/chest'
import { MessageForm } from 'lib/form/message'
import { BUTTON } from 'lib/form/utils'
import { typeIdToReadable } from 'lib/game-utils'
import { Cost, MultiCost, ShouldHaveItemCost } from 'lib/shop/cost'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { Shop, ShopProduct, ShopProductBuy } from './shop'

interface ShopSection {
  name: MaybeRawText
  onOpen: (form: ShopForm) => void
}

export class ShopForm {
  private buttons: (ShopProduct | ShopSection)[] = []

  constructor(
    private title: MaybeRawText,
    private body: MaybeRawText,
  ) {}

  /**
   * Adds subsection to the menu
   *
   * @param name
   * @param onOpen
   * @returns
   */
  addSection(name: ShopSection['name'], onOpen: ShopSection['onOpen']) {
    this.buttons.push({ name, onOpen })
    return this
  }

  /**
   * Adds buyable product to the shop menu
   *
   * @param name
   * @param cost
   * @param onBuy
   * @returns
   */
  addProduct<T extends Cost>(name: ShopProduct<T>['name'], cost: T, onBuy: ShopProduct<T>['onBuy']) {
    this.buttons.push({ name, cost, onBuy })
    return this
  }

  addItemModifier(
    name: ShopProduct['name'],
    cost: Cost,
    itemFilter: (itemStack: ItemStack) => boolean,
    modifyItem: (itemSlot: ContainerSlot) => void,
  ) {
    return this.addProduct(
      name,
      new MultiCost(new ShouldHaveItemCost('', 1, itemFilter), cost),
      (player, text, success) => {
        const form = new ChestForm('45').title(text).pattern([0, 0], ['<-------?'], {
          '<': {
            icon: BUTTON['<'],
            callback: () => {
              this.show(player)
            },
          },
          '-': {
            icon: MinecraftBlockTypes.GlassPane,
          },
          '?': {
            icon: BUTTON['?'],
          },
        })

        const { container } = player
        if (!container) return
        for (const [i, item] of container.entries().filter(([, item]) => item && itemFilter(item))) {
          if (!item) continue
          form.button({
            slot: i + 9,
            icon: item.typeId,
            nameTag: typeIdToReadable(item.typeId),
            amount: item.amount,
            lore: item.getLore(),
            callback: () => {
              cost.buy(player)
              modifyItem(container.getSlot(i))
              success()
            },
          })
        }

        form.show(player)
        return false
      },
    )
  }

  /**
   * Adds buyable item to shop menu
   *
   * @param item
   * @param cost
   */
  addItemStack(item: ItemStack, cost: Cost) {
    this.addProduct(itemDescription(item, ''), cost, player => {
      if (!player.container) return

      cost.buy(player)
      player.container.addItem(item)
    })
    return this
  }

  /**
   * Opens store menu to player
   *
   * @param player - Player to open store for
   * @param message - Additional message to show in store description
   */
  show(player: Player, message: MaybeRawText = '', back?: VoidFunction) {
    const form = new ActionForm(this.title, t.raw`${message}${message ? '§r\n \n§f' : ''}${this.body}`)
    if (back) form.addButtonBack(back)

    for (const button of this.buttons) {
      if ('cost' in button) {
        const { name, cost, onBuy } = button
        const canBuy = cost.has(player)
        const text = typeof name === 'function' ? name(canBuy) : name

        form.addButton(
          t.options({ unitColor: canBuy ? '§f' : '§7' }).raw`§l${text}§r\n${cost.toString(canBuy, player)}`,
          () => this.buy({ text: text, cost, onBuy, player, back }),
        )
      } else {
        const { name, onOpen } = button

        form.addButton(t.options({ unitColor: '§3' }).raw`${name}`, () => {
          const form = new ShopForm(t.header.raw`${this.title} > ${name}`, this.body)
          onOpen(form)
          form.show(player, '', () => this.show(player))
        })
      }
    }

    form.show(player)
  }

  private buy({ onBuy, cost, player, text, back }: ShopProductBuy) {
    const canBuy = () => {
      if (!cost.has(player)) {
        this.show(player, t.raw`${t.error`Недостаточно средств:\n`}${cost.failed(player)}`, back)
        return false
      } else return true
    }

    if (!canBuy()) return

    const purchase = () => {
      if (!canBuy()) return

      const successBuy = () =>
        this.show(player, t.options({ textColor: '§a' }).raw`Успешная покупка: ${text} за ${cost.toString()}!`)

      if (onBuy(player, text, successBuy) !== false) successBuy()
    }

    if (Shop.getPlayerSettings(player).prompt) {
      new MessageForm(t.header`Подтверждение`, t.raw`Купить ${text} за ${cost.toString()}?`)
        .setButton1(t`Купить!`, purchase)
        .setButton2(t.error`Отмена`, () => this.show(player, t.error`Покупка отменена`))
        .show(player)
    } else purchase()
  }
}
