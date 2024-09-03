import { Player } from '@minecraft/server'
import { Settings } from 'lib/settings'
import { LeafyCost, MoneyCost } from 'lib/shop/cost'
import { t, textTable } from 'lib/text'
import { ShopForm, ShopMenuCreate } from './form'

export class Shop {
  static getPlayerSettings = Settings.player('Магазин\n§7Внутриигровой магазин', 'market', {
    prompt: {
      name: 'Подтверждение покупки',
      description: 'Определяет, включено ли подтверждение перед покупкой.',
      value: true,
    },
    defaultBody: {
      name: 'Показывать счет',
      description: 'Показывать ли счет в меню (монеты, листья)',
      value: false,
    },
  })

  /** List of all available shops */
  static shops = new Map<string, Shop>()

  /**
   * Creates new Shop
   *
   * @param name - Name of the shop that will be displayed in form
   */
  constructor(
    private name: string,
    readonly id: string,
  ) {
    const shop = Shop.shops.get(id)
    if (shop) {
      console.warn(new Error(t.error`Shop ${id} already exists`))
      return shop
    }

    Shop.shops.set(id, this)
  }

  private useDefaultBody = true

  private static defaultBody = (player: Player) =>
    Shop.getPlayerSettings(player).defaultBody
      ? textTable({
          'Подтверждение перед покупкой': Shop.getPlayerSettings(player).prompt,
          'Ваш баланс':
            new MoneyCost(player.scores.money).toString() + ' ' + new LeafyCost(player.scores.leafs).toString(),
        })
      : ''

  private getBody = (player: Player): Text => ''

  /**
   * Sets shop body
   *
   * @param body - Shop body generator function
   * @param useDefaultBody - Whenether to use default body with balance and other info or not
   */
  body(body: (player: Player) => Text, useDefaultBody = true) {
    this.getBody = body
    this.useDefaultBody = useDefaultBody
    return this
  }

  private onOpen: ShopMenuCreate = menu => menu

  /**
   * Sets shop menu generator function
   *
   * @param generate - Function that recives menu and adds buttons/sections to it
   */
  menu(generate: ShopMenuCreate) {
    this.onOpen = generate
    return this
  }

  /**
   * Opens menu for the specified player
   *
   * @param player - Player to open menu for
   */
  open(player: Player) {
    new ShopForm(
      () => t.header.raw`${this.name}`,
      () => t.raw`${this.getBody(player)}${this.useDefaultBody ? Shop.defaultBody(player) : ''}`,
      this,
      this.onOpen,
      player,
    ).show()
  }
}
