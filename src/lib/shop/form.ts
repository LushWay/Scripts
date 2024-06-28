import { ContainerSlot, ItemStack, Player } from '@minecraft/server'
import { MinecraftBlockTypes, MinecraftItemTypes } from '@minecraft/vanilla-data'
import { table } from 'lib/database/abstract'
import { ActionForm } from 'lib/form/action'
import { ChestForm } from 'lib/form/chest'
import { MessageForm } from 'lib/form/message'
import { BUTTON } from 'lib/form/utils'
import { typeIdToReadable } from 'lib/game-utils'
import { Cost, ItemCost, MoneyCost, MultiCost, ShouldHaveItemCost } from 'lib/shop/cost'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { Shop, ShopMenuGenerator, ShopProduct, ShopProductBuy } from './shop'

interface ShopSection {
  name: MaybeRawText
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
    this.addSection(itemDescription({ typeId: type, amount: 0 }), form => {
      const db = ShopForm.database[this.shop.id]
      const buy = ~~((maxCount / count) * minPrice)
      const sell = ~~(buy / 2)

      const original = form.body
      form.body = () => t.raw`${original()}\nТовара на складе: ${t`${db[type] ?? 0}/${maxCount}`}`

      form.addSection('§3Продать', form => {
        function addSell(count = 1) {
          const cost = new ItemCost(type, count)
          form.addProduct(new MoneyCost(sell * count).toString(), cost, player => {
            cost.buy(player)

            db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
            player.scores.money += sell * count
          })
        }

        addSell(1)
        addSell(10)
        addSell(20)
        addSell(100)
      })

      function addBuy(count = 1) {
        const cost = new MoneyCost(buy * count)
        form.addProduct(itemDescription({ typeId: type, amount: count }), cost, player => {
          if (!player.container) return

          cost.buy(player)
          db[type] = Math.max(0, (db[type] ?? count) - count)
          player.container.addItem(new ItemStack(type, count))
        })
      }
      addBuy(1)
      addBuy(10)
      addBuy(20)
      addBuy(100)
    })
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
        const { name, cost, onBuy } = button
        const canBuy = cost.has(player)
        const unit = canBuy ? '§f' : '§7'
        const text = typeof name === 'function' ? name(canBuy) : name

        actionForm.addButton(t.options({ unit }).raw`§l${text}§r\n${cost.toString(canBuy, player)}`, () =>
          this.buy({ text: text, cost, onBuy, player, back }),
        )
      } else {
        const { name, onOpen } = button

        actionForm.addButton(t.options({ unit: '§3' }).raw`${name}`, () => {
          new ShopForm(() => t.header.raw`${form.title()} > ${name}`, form.body, this.shop, onOpen).show(
            player,
            '',
            () => this.show(player),
          )
        })
      }
    }

    actionForm.show(player)
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
        this.show(player, t.options({ text: '§a' }).raw`Успешная покупка: ${text} за ${cost.toString()}!`)

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
