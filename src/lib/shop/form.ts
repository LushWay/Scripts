import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { MessageForm } from 'lib/form/message'
import { Cost } from 'lib/shop/cost'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { createItemModifier, createItemModifierSection, ShopMenuWithSlotCreate } from './buttons/item-modifier'
import { createSellableItem } from './buttons/sellable-item'
import { CostType } from './cost/cost'
import { ItemFilter } from './cost/item-cost'
import { Shop } from './shop'

export type ShopMenuCreate = (menu: ShopFormSection, player: Player) => void

interface ShopSection {
  name: MaybeRawText
  texture?: string
  onOpen: ShopMenuCreate
}

export interface ShopProduct<T = unknown> {
  name: MaybeRawText | ((canBuy: boolean) => MaybeRawText)
  cost: Cost<T>
  onBuy: (player: Player, text: MaybeRawText, successBuy: VoidFunction) => void | false
  texture?: string
  sell?: boolean
}

interface ShopCallbackButton {
  text: MaybeRawText
  texture?: string
  callback: VoidFunction
}

type ShopProductBuy = Omit<ShopProduct, 'name'> & {
  player: Player
  text: MaybeRawText
  back?: VoidFunction
}

export type ShopFormSection = Omit<ShopForm, 'show'> & {
  show: VoidFunction
  body: ShopForm['body']
  title: ShopForm['title']
}

type Buttons = (ShopProduct | ShopSection | ShopCallbackButton)[]

export class ShopForm {
  static database = table<Record<string, number | undefined>>('shop', () => ({}))

  private buttons: Buttons = []

  constructor(
    private title: () => MaybeRawText,
    private body: () => MaybeRawText,
    private readonly shop: Shop,
    private readonly onOpen: ShopMenuCreate,
  ) {}

  /**
   * Adds subsection to the menu
   *
   * @param name
   * @param onOpen
   * @returns
   */
  section(name: ShopSection['name'], onOpen: ShopSection['onOpen'], texture?: string) {
    this.buttons.push({ name, onOpen, texture })
    return this
  }

  button(
    text: ShopCallbackButton['text'],
    texture: ShopCallbackButton['texture'],
    callback: ShopCallbackButton['callback'],
  ) {
    this.buttons.push({ text, texture, callback })
  }

  /**
   * Adds buyable product to the shop menu
   *
   * @param name
   * @param cost
   * @param onBuy
   * @returns
   */
  product<T extends Cost>(
    name: ShopProduct<T>['name'],
    cost: T,
    onBuy: ShopProduct<T>['onBuy'],
    texture?: string,
    sell?: boolean,
  ) {
    this.buttons.push({ name, cost, onBuy, texture, sell })
    return this
  }

  itemModifier(
    name: ShopProduct['name'],
    cost: Cost,
    itemFilter: (itemStack: ItemStack) => boolean,
    modifyItem: (itemSlot: ContainerSlot) => void,
  ) {
    createItemModifier(this, name, cost, itemFilter, modifyItem)
    return this
  }

  itemModifierSection(
    name: MaybeRawText,
    itemFilter: ItemFilter,
    itemFilterName: MaybeRawText,
    onOpen: ShopMenuWithSlotCreate,
  ) {
    createItemModifierSection(this, this.shop, name, itemFilterName, itemFilter, onOpen)
    return this
  }

  sellableItem(type: MinecraftItemTypes) {
    return {
      /** Sets default count */
      defaultCount: (defaultCount = 100) => ({
        /** Sets max count */
        maxCount: (maxCount = 1000) => ({
          /** Sets base price (aka minPrice) */
          basePrice: (minPrice: number) => {
            const db = ShopForm.database[this.shop.id]
            const count = (db[type] ??= defaultCount)

            createSellableItem({ form: this, shop: this.shop, type, count, maxCount, minPrice })
            return this as ShopForm
          },
        }),
      }),
    }
  }

  /**
   * Adds buyable item to shop menu
   *
   * @param item
   * @param cost
   */
  itemStack(item: ItemStack, cost: Cost) {
    this.product(itemDescription(item, ''), cost, player => {
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
  show(player: Player, message: MaybeRawText = '', back: undefined | VoidFunction) {
    const show = () => this.show(player, undefined, back)
    const form = Object.setPrototypeOf({ buttons: [], show } satisfies Base, this) as ShopFormSection & Base
    this.onOpen(form, player)

    const actionForm = new ActionForm(form.title(), t.raw`${message}${message ? '§r\n \n§f' : ''}${form.body()}`)
    if (back) actionForm.addButtonBack(back)

    for (const button of form.buttons) {
      if ('cost' in button) {
        // Buy/sell
        const { name, cost, onBuy, texture, sell } = button
        const canBuy = cost.has(player)
        const unit = canBuy ? '§f' : '§7'
        const text = typeof name === 'function' ? name(canBuy) : name

        actionForm.addButton(t.options({ unit }).raw`§l${text}§r\n${cost.toString(canBuy, player)}`, texture, () =>
          this.buy({ text: text, cost, onBuy, player, back, sell }),
        )
      } else if ('onOpen' in button) {
        // Section
        const { name, onOpen, texture } = button

        actionForm.addButton(t.options({ unit: '§3' }).raw`${name}`, texture, () => {
          ShopForm.showSection(name, form, this.shop, player, show, onOpen)
        })
      } else {
        // Common button
        actionForm.addButton(button.text, button.texture, button.callback)
      }
    }

    actionForm.show(player)
  }

  static showSection(
    name: MaybeRawText,
    parent: Pick<ShopFormSection, 'body' | 'title'>,
    shop: Shop,
    player: Player,
    back: undefined | VoidFunction,
    onOpen: ShopMenuCreate,
  ) {
    const title = () => t.header.raw`${parent.title()} > ${name}`
    const form = new ShopForm(title, () => '', shop, onOpen)
    form.show(player, undefined, back)
  }

  static toShopFormSection(form: ShopForm): Pick<ShopFormSection, 'body' | 'title'> {
    return { body: form.body, title: form.title }
  }

  private buy({ onBuy, cost, player, text, back, sell }: ShopProductBuy) {
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
        this.show(
          player,
          t.options({ text: '§a' }).raw`Успешная ${sell ? 'продажа' : 'покупка'}: ${text} за ${cost.toString()}!`,
          back,
        )

      if (onBuy(player, text, successBuy) !== false) successBuy()
    }

    if (Shop.getPlayerSettings(player).prompt && cost.type === CostType.Action) {
      new MessageForm(
        t.header`Подтверждение`,
        sell
          ? t.raw`Продать ${cost.toString()}§r§7 за ${text}§r§7?`
          : t.raw`Купить ${text}§r§7 за ${cost.toString()}§r§7?`,
      )
        .setButton1(sell ? t`Продать!` : t`Купить!`, purchase)
        .setButton2(t.error`Отмена`, () =>
          this.show(player, sell ? t.error`Продажа отменена` : t.error`Покупка отменена`, back),
        )
        .show(player)
    } else purchase()
  }
}

interface Base {
  buttons: ShopForm['buttons']
  show: VoidFunction
}
