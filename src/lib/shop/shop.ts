import { Player } from '@minecraft/server'
import { i18n, noI18n, textTable } from 'lib/i18n/text'
import { Settings } from 'lib/settings'
import { LeafyCost, MoneyCost } from 'lib/shop/cost'
import { ShopForm, ShopMenuCreate } from './form'

export class Shop {
  static getPlayerSettings = Settings.player(i18n`Магазин\n§7Внутриигровой магазин`, 'market', {
    prompt: {
      name: i18n`Подтверждение покупки`,
      description: i18n`Определяет, включено ли подтверждение перед покупкой.`,
      value: true,
    },
    defaultBody: {
      name: i18n`Показывать счет`,
      description: i18n`Показывать ли счет в меню (монеты, листья)`,
      value: false,
    },
    sellableItemsScreen: {
      name: i18n`Продаваемые предметы`,
      description: i18n`Сразу открывать меню покупки`,
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
    private name: SharedText | string,
    readonly id: string,
  ) {
    const shop = Shop.shops.get(id)
    if (shop) {
      console.warn(new Error(noI18n.error`Shop ${id} already exists`))
      return shop
    }

    Shop.shops.set(id, this)
  }

  private useDefaultBody = true

  private static defaultBody = (player: Player) =>
    Shop.getPlayerSettings(player).defaultBody
      ? textTable([
          [i18n`Подтверждение перед покупкой`, Shop.getPlayerSettings(player).prompt],
          [
            i18n`Ваш баланс`,
            new MoneyCost(player.scores.money).toString(player) +
              ' ' +
              new LeafyCost(player.scores.leafs).toString(player),
          ],
        ])
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
      () => i18n.header`${this.name}`,
      () => i18n`${this.getBody(player)}${this.useDefaultBody ? Shop.defaultBody(player) : ''}`,
      this,
      this.onOpen,
      player,
    ).show()
  }
}
