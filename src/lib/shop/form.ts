import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ChestForm, getAuxOrTexture } from 'lib/form/chest'
import { MessageForm } from 'lib/form/message'
import { BUTTON } from 'lib/form/utils'
import { typeIdToReadable } from 'lib/game-utils'
import { Cost, ItemCost, MoneyCost, MultiCost, NoItemsToSell, ShouldHaveItemCost, TooMuchItems } from 'lib/shop/cost'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { Shop, ShopMenuGenerator, ShopProduct, ShopProductBuy } from './shop'

interface ShopSection {
  name: MaybeRawText
  texture?: string
  onOpen: ShopMenuGenerator
}

type Buttons = (ShopProduct | ShopSection)[]

export class ShopForm {
  static database = table<Record<string, number | undefined>>('shop', () => ({}))

  private buttons: Buttons = []

  constructor(
    private title: () => MaybeRawText,
    private body: () => MaybeRawText,
    private readonly shop: Shop,
    private readonly onOpen: ShopMenuGenerator,
  ) {}

  /**
   * Adds subsection to the menu
   *
   * @param name
   * @param onOpen
   * @returns
   */
  addSection(name: ShopSection['name'], onOpen: ShopSection['onOpen'], texture?: string) {
    this.buttons.push({ name, onOpen, texture })
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
  addProduct<T extends Cost>(
    name: ShopProduct<T>['name'],
    cost: T,
    onBuy: ShopProduct<T>['onBuy'],
    texture?: string,
    sell?: boolean,
  ) {
    this.buttons.push({ name, cost, onBuy, texture, sell })
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
              this.show(player, undefined, undefined)
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

  addConfigurableItemSection(type: MinecraftItemTypes) {
    return {
      /** Sets default count */
      defaultCount: (defaultCount = 100) => ({
        /** Sets max count */
        maxCount: (maxCount = 1000) => ({
          /** Sets base price (aka minPrice) */
          basePrice: (minPrice: number) => {
            const db = ShopForm.database[this.shop.id]
            const count = (db[type] ??= defaultCount)

            this.createConfigurableItem({ type, count, maxCount, minPrice })
            return this as ShopForm
          },
        }),
      }),
    }
  }

  private createConfigurableItem({
    type,
    count,
    maxCount,
    minPrice,
  }: {
    type: MinecraftItemTypes
    count: number
    maxCount: number
    minPrice: number
  }) {
    const aux = getAuxOrTexture(type)
    this.addSection(
      itemDescription({ typeId: type, amount: 0 }),
      form => {
        const db = ShopForm.database[this.shop.id]
        const buy = ~~((maxCount / count) * minPrice)
        const original = form.body.bind(form)
        form.body = () => t.raw`${original()}\nТовара на складе: ${t`${db[type] ?? 0}/${maxCount}`}`

        form.addSection(
          '§3Продать',
          form => {
            const buy = ~~((maxCount / count) * minPrice)
            const sell = ~~(buy / 2)

            function addSell(count = 1) {
              const cost = new ItemCost(type, count)
              form.addProduct(
                new MoneyCost(sell * count).toString(),
                count + (db[type] ?? 0) > maxCount ? TooMuchItems : cost,
                player => {
                  cost.buy(player)

                  db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
                  player.scores.money += sell * count
                },
                aux,
                true,
              )
            }

            addSell(1)
            addSell(10)
            addSell(20)
            addSell(100)
          },
          BUTTON['+'],
        )

        function addBuy(count = 1) {
          const cost = new MoneyCost(buy * count)
          form.addProduct(
            itemDescription({ typeId: type, amount: count }),
            (db[type] ?? 0) - count < 0 ? NoItemsToSell : cost,
            player => {
              if (!player.container) return

              cost.buy(player)
              db[type] = Math.max(0, (db[type] ?? count) - count)
              player.container.addItem(new ItemStack(type, count))
            },
            aux,
          )
        }
        addBuy(1)
        addBuy(10)
        addBuy(20)
        addBuy(100)
      },
      aux,
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
  show(player: Player, message: MaybeRawText = '', back: undefined | VoidFunction) {
    const form: { buttons: Buttons; body: () => MaybeRawText; title: () => MaybeRawText } = {
      buttons: [],
      body: this.body,
      title: this.title,
    }
    this.onOpen(Object.setPrototypeOf(form, this) as this, player)

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
      } else {
        // Section
        const { name, onOpen, texture } = button

        actionForm.addButton(t.options({ unit: '§3' }).raw`${name}`, texture, () => {
          new ShopForm(() => t.header.raw`${form.title()} > ${name}`, form.body, this.shop, onOpen).show(
            player,
            undefined,
            () => this.show(player, undefined, back),
          )
        })
      }
    }

    actionForm.show(player)
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

    if (Shop.getPlayerSettings(player).prompt) {
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
