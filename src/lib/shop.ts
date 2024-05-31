import { ItemStack, Player, system } from '@minecraft/server'

import { PlaceAction, Settings, location } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { Cost } from 'lib/cost'
import { ActionForm } from 'lib/form/action'
import { MessageForm } from 'lib/form/message'
import { Npc } from 'lib/npc'
import { itemDescription } from './rewards'
import { t, textTable } from './text'

interface ShopOptions {
  group: string
  name: string
  body: (player: Player) => string
}

interface ShopProduct {
  name: Text | ((canBuy: boolean) => Text)
  cost: Cost
  onBuy: (player: Player) => void
}

interface ShopSection {
  name: Text
  onOpen: (form: ShopForm) => void
}

type ShopProductBuy = Omit<ShopProduct, 'name'> & {
  player: Player
  text: Text
}

type ShopMenuGenerator = (menu: ShopForm, player: Player) => void

export class Shop {
  static block(options: ShopOptions & { dimensionId: Dimensions }) {
    const shop = new Shop(options.group, options.name)
    location(options.group, options.name).onLoad.subscribe(location => {
      /** We dont actually want to store that on disk */
      const cooldownDatabase: JsonObject = {}

      PlaceAction.onInteract(
        location,
        player => {
          system.delay(() => {
            const cooldown = new Cooldown(cooldownDatabase, 'store', player, 1000, false)
            if (cooldown.tellIfExpired()) {
              cooldown.start()
              shop.open(player)
            }
          })
          return true
        },
        options.dimensionId,
      )
    })

    return shop
  }

  static npc(options: ShopOptions & { dimensionId?: Dimensions; id: string }) {
    const shop = new Shop(options.group, options.name)
    const entity = new Npc({
      ...options,
      onInteract: event => shop.open(event.player),
    })

    return { shop, entity }
  }

  static getPlayerSettings = Settings.player('Магазин\n§7Внутриигровой магазин', 'market', {
    prompt: {
      name: 'Подтверждение покупки',
      description: 'Определяет, включено ли подтверждение перед покупкой.',
      value: true,
    },
  })

  static shops: Shop[] = []

  constructor(
    private group: string,
    private name: string,
  ) {
    Shop.shops.push(this)
  }

  private defaultBody = (player: Player) =>
    textTable({
      'Подтверждение перед покупкой': Shop.getPlayerSettings(player).prompt,
      'Ваш баланс': `${player.scores.money}${emoji.money}`,
    })

  private getBody = (player: Player): Text => ''

  body(body: (player: Player) => Text, useDefaultBody: boolean) {
    this.getBody = body
    if (!useDefaultBody) this.defaultBody = () => ''
    else this.defaultBody = Shop.prototype.defaultBody
    return this
  }

  private getMenu: ShopMenuGenerator

  menu(generate: ShopMenuGenerator) {
    this.getMenu = generate
    return this
  }

  open(player: Player) {
    const menu = new ShopForm(this.name, this.getBody(player) + this.defaultBody(player))
    this.getMenu(menu, player)
    menu.show(player)
  }
}

export class ShopForm {
  private buttons: (ShopProduct | ShopSection)[] = []

  constructor(
    private title: string,
    private body: string,
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
  addProduct(name: ShopProduct['name'], cost: ShopProduct['cost'], onBuy: ShopProduct['onBuy']) {
    this.buttons.push({ name, cost, onBuy })
    return this
  }

  /**
   * Adds buyable item to shop menu
   *
   * @param item
   * @param cost
   */
  addItem(item: ItemStack, cost: Cost) {
    this.addProduct(
      canBuy => itemDescription(item, canBuy ? '§g' : '§7', true),
      cost,
      player => {
        if (!player.container) return

        cost.buy(player)
        player.container.addItem(item)
      },
    )
    return this
  }

  /**
   * Opens store menu to player
   *
   * @param player - Player to open store for
   * @param message - Additional message to show in store description
   */
  show(player: Player, message = '', back?: VoidFunction) {
    if (message) message += '§r\n \n§f'

    const form = new ActionForm(this.title, message + this.body)
    if (back) form.addButtonBack(back)

    for (const button of this.buttons) {
      if ('cost' in button) {
        const { name, cost, onBuy } = button
        const canBuy = cost.check(player)
        const text = typeof name === 'string' ? name : name(canBuy)

        form.addButton(`${name}${cost.toString(canBuy)}`, () => this.buy({ text: text, cost, onBuy, player }))
      } else {
        const { name, onOpen } = button

        form.addButton(name, () => {
          const form = new ShopForm(name, '')
          onOpen(form)
          form.show(player)
        })
      }
    }

    form.show(player)
  }

  private buy({ onBuy, cost, player, text }: ShopProductBuy) {
    const canBuy = () => {
      if (!cost.check(player)) {
        this.show(player, cost.failed(player))
        return false
      } else return true
    }

    if (!canBuy()) return

    const purchase = () => {
      if (!canBuy()) return
      onBuy(player)
      this.show(player, `§aУспешная покупка: §f${text} §aза ${cost.toString()}§a!`)
    }

    if (Shop.getPlayerSettings(player).prompt) {
      new MessageForm(t.header`Подтверждение`, t`Купить ${text} за ${cost.toString()}?`)
        .setButton1(t`Купить!`, purchase)
        .setButton2(t.error`Отмена`, () => this.show(player, t.error`Покупка отменена`))
        .show(player)
    } else purchase()
  }
}
