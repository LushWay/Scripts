import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { getAuxOrTexture } from 'lib/form/chest'
import { Cost } from 'lib/shop/cost'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { isKeyof } from 'lib/util'
import { createItemModifier, createItemModifierSection, ShopMenuWithSlotCreate } from './buttons/item-modifier'
import { createSellableItem } from './buttons/sellable-item'
import { ItemFilter } from './cost/item-cost'
import { Product, ProductName } from './product'
import { Shop } from './shop'

export type ShopMenuCreate = (menu: ShopFormSection, player: Player) => void

type MaybeRawTextFn = () => MaybeRawText

interface Section {
  name: MaybeRawText
  texture?: string
  onOpen: ShopMenuCreate
}

interface SimpleButton {
  text: MaybeRawText
  texture?: string
  callback: VoidFunction
}

interface BodyAndTitle {
  body: MaybeRawTextFn
  title: MaybeRawTextFn
}

export type ShopFormSection = {
  show: (message?: MaybeRawText) => void
} & BodyAndTitle &
  Omit<ShopForm, 'show'>

type Buttons = (Section | SimpleButton)[]

export class ShopForm {
  static database = table<Record<string, number | undefined>>('shop', () => ({}))

  private buttons: Buttons = []

  constructor(
    private title: MaybeRawTextFn,
    private body: MaybeRawTextFn,
    private readonly shop: Shop,
    private readonly onOpen: ShopMenuCreate,
    private player: Player,
    private back?: VoidFunction,
  ) {}

  /**
   * Adds subsection to the menu
   *
   * @param name
   * @param onOpen
   * @returns
   */
  section(name: Section['name'], onOpen: Section['onOpen'], texture?: string) {
    this.buttons.push({ name, onOpen, texture })
    return this
  }

  button(text: SimpleButton['text'], texture: SimpleButton['texture'], callback: SimpleButton['callback']) {
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
  product() {
    return Product.create()
      .creator<Product>(
        product => {
          this.buttons.push(product)
          return product
        },
        message => this.show(message),
      )
      .player(this.player)
  }

  itemModifier(
    name: ProductName,
    cost: Cost,
    itemFilter: (itemStack: ItemStack) => boolean,
    itemFilterName: MaybeRawText,
    modifyItem: (itemSlot: ContainerSlot, itemStack: ItemStack, successBuyText: MaybeRawText) => boolean | void,
  ) {
    createItemModifier(this, name, cost, itemFilterName, itemFilter, modifyItem)
    return this
  }

  itemModifierSection(
    name: MaybeRawText,
    itemFilter: ItemFilter,
    itemFilterName: MaybeRawText,
    onOpen: ShopMenuWithSlotCreate,
    manualAddSelectItem = false,
  ) {
    createItemModifierSection(this, this.shop, name, itemFilterName, itemFilter, onOpen, manualAddSelectItem)
    return this
  }

  protected inventory?: Map<string, number>

  dynamicCostItem(typeId: keyof (typeof shopFormula)['shop']): ShopForm

  dynamicCostItem(typeId: MinecraftItemTypes, template: ValueOf<(typeof shopFormula)['shop']>): ShopForm

  dynamicCostItem(typeId: MinecraftItemTypes, template?: ValueOf<(typeof shopFormula)['shop']>): ShopForm {
    if (isKeyof(typeId, shopFormula.shop)) template ??= shopFormula.shop[typeId]
    if (!template) throw new Error('No template was provided for typeId ' + typeId)

    this.inventory ??= this.player.container
      ? [...this.player.container.entries()].reduce((acc, [, item]) => {
          if (item) {
            const amount = acc.get(item.typeId) ?? 0
            acc.set(item.typeId, amount + item.amount)
          }

          return acc
        }, new Map<string, number>())
      : new Map<string, number>()

    createSellableItem({
      player: this.player,
      form: this,
      shop: this.shop,
      inventory: this.inventory,
      type: typeId,
      ...template,
    })
    return this as ShopForm
  }

  /**
   * Adds buyable item to shop menu
   *
   * @param item
   * @param cost
   */
  itemStack(item: ItemStack, cost: Cost, texture = getAuxOrTexture(item.typeId)) {
    this.product()
      .name(itemDescription(item, ''))
      .cost(cost)
      .onBuy(player => {
        if (!player.container) return

        cost.take(player)
        player.container.addItem(item)
      })
      .setTexture(texture)
      .setTakeCost(false)

    return this
  }

  /**
   * Opens store menu to player
   *
   * @param player - Player to open store for
   * @param message - Additional message to show in store description
   */
  show = (message: MaybeRawText = '') => {
    const { player, back } = this
    const form = Object.setPrototypeOf({ buttons: [] } satisfies { buttons: Buttons }, this) as ShopFormSection & {
      buttons: Buttons
    }
    this.onOpen(form, player)

    const actionForm = new ActionForm(form.title(), t.raw`${message}${message ? '§r\n \n§f' : ''}${form.body()}`)
    if (back) actionForm.addButtonBack(back)

    for (const button of form.buttons) {
      if ('onOpen' in button) {
        // Section
        const { name, onOpen, texture } = button

        actionForm.addButton(t.options({ unit: '§3' }).raw`${name}`, texture, () => {
          ShopForm.showSection(name, form, this.shop, player, this.show, onOpen)
        })
      } else {
        // Common button
        actionForm.addButton(button.text, button.texture, button.callback)
      }
    }

    actionForm.show(this.player)
  }

  static showSection(
    name: MaybeRawText,
    parent: BodyAndTitle,
    shop: Shop,
    player: Player,
    back: undefined | VoidFunction,
    onOpen: ShopMenuCreate,
  ) {
    const title = () => t.header.raw`${parent.title()} > ${name}`
    new ShopForm(title, () => '', shop, onOpen, player, back).show()
  }

  static toShopFormSection(form: ShopForm): BodyAndTitle {
    return { body: form.body, title: form.title }
  }
}
