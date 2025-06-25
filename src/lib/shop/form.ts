import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import {
  MinecraftItemTypes,
  MinecraftPotionEffectTypes as PotionEffects,
  MinecraftPotionLiquidTypes as PotionLiquids,
  MinecraftPotionModifierTypes as PotionModifiers,
} from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { getAuxOrTexture, getAuxTextureOrPotionAux } from 'lib/form/chest'
import { Message } from 'lib/i18n/message'
import { i18n, i18nJoin, Text } from 'lib/i18n/text'
import { Cost } from 'lib/shop/cost'
import { isKeyof } from 'lib/util'
import { itemNameXCount } from '../utils/item-name-x-count'
import { createItemModifier, createItemModifierSection, ShopMenuWithSlotCreate } from './buttons/item-modifier'
import { createSellableItem } from './buttons/sellable-item'
import { ItemFilter } from './cost/item-cost'
import { Product, ProductName } from './product'
import { getFreeSpaceForItemInInventory, InventoryFull } from './sell-buy-errors'
import { Shop } from './shop'

export type ShopMenuCreate = (menu: ShopFormSection, player: Player) => void

type MaybeRawTextFn = () => Text

interface Section {
  name: Text
  texture?: string
  onOpen: ShopMenuCreate
}

interface SimpleButton {
  text: Text
  texture?: string
  callback: VoidFunction
}

interface BodyAndTitle {
  body: MaybeRawTextFn
  title: MaybeRawTextFn
}

export type ShopFormSection = {
  show: (message?: Text) => void
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
    itemFilterName: Text,
    modifyItem: (itemSlot: ContainerSlot, itemStack: ItemStack, successBuyText: Text) => boolean | void,
  ) {
    createItemModifier(this, name, cost, itemFilterName, itemFilter, modifyItem)
    return this
  }

  itemModifierSection(
    name: Text,
    itemFilter: ItemFilter,
    itemFilterName: Text,
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

  /** Adds buyable item to shop menu */
  itemStack(
    item: ItemStack,
    cost: Cost,
    texture = item.typeId.includes('potion') ? getAuxTextureOrPotionAux(item) : getAuxOrTexture(item.typeId),
    name = itemNameXCount(item, '', undefined, this.player),
  ) {
    const space = getFreeSpaceForItemInInventory(this.player, item)
    const canAdd = space >= item.amount
    this.product()
      .name(name)
      .cost(canAdd ? cost : InventoryFull(item.amount - space))
      .onBuy(player => {
        if (!player.container) return

        cost.take(player)
        player.container.addItem(item)
      })
      .setTexture(texture)
      .setTakeCost(false)

    return this
  }

  potion(cost: Cost, effect: PotionEffects, modifier = PotionModifiers.Normal, liquid = PotionLiquids.Regular) {
    const item = ItemStack.createPotion({ effect, modifier, liquid })
    this.itemStack(item, cost, getAuxTextureOrPotionAux(item))
  }

  /**
   * Opens store menu to player
   *
   * @param player - Player to open store for
   * @param message - Additional message to show in store description
   */
  show = (message: Text = '') => {
    const { player, back } = this
    const form = Object.setPrototypeOf({ buttons: [] } satisfies { buttons: Buttons }, this) as ShopFormSection & {
      buttons: Buttons
    }
    this.onOpen(form, player)

    // TODO Fix colors
    const actionForm = new ActionForm(
      Message.translate(player.lang, form.title()),
      i18nJoin`${message}${message ? '\n\n' : ''}${form.body()}`.toString(player.lang),
    )
    if (back) actionForm.addButtonBack(back)

    for (const button of form.buttons) {
      if ('onOpen' in button) {
        // Section
        const { name, onOpen, texture } = button

        actionForm.button(i18nJoin`${name}`.color(i18nJoin.accent).toString(player.lang), texture, () => {
          ShopForm.showSection(name, form, this.shop, player, this.show, onOpen)
        })
      } else {
        // Common button
        actionForm.button(button.text.toString(player.lang), button.texture, button.callback)
      }
    }

    actionForm.show(this.player)
  }

  static showSection(
    name: Text,
    parent: BodyAndTitle,
    shop: Shop,
    player: Player,
    back: undefined | VoidFunction,
    onOpen: ShopMenuCreate,
  ) {
    const title = () => i18n.header`${parent.title()} > ${name}`
    new ShopForm(title, () => '', shop, onOpen, player, back).show()
  }

  static toShopFormSection(form: ShopForm): BodyAndTitle {
    return { body: form.body, title: form.title }
  }
}
