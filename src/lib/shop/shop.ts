import { Player, system } from '@minecraft/server'
import { PlaceAction } from 'lib/action'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { location } from 'lib/location'
import { Npc } from 'lib/rpg/npc'
import { Settings } from 'lib/settings'
import { Cost } from 'lib/shop/cost'
import { MaybeRawText, t, textTable } from 'lib/text'
import { ShopForm } from './form'

interface ShopOptions {
  group: string
  name: string
  body: (player: Player) => string
}

export interface ShopProduct<T = unknown> {
  name: MaybeRawText | ((canBuy: boolean) => MaybeRawText)
  cost: Cost<T>
  onBuy: (player: Player, text: MaybeRawText, successBuy: VoidFunction) => void | false
}

export type ShopProductBuy = Omit<ShopProduct, 'name'> & {
  player: Player
  text: MaybeRawText
  back?: VoidFunction
}

type ShopMenuGenerator = (menu: ShopForm, player: Player) => void

export class Shop {
  static block(options: ShopOptions & { dimensionId: Dimensions }) {
    const shop = new Shop(options.name)
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
    const shop = new Shop(options.name)
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

  constructor(private name: string) {
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
    const menu = new ShopForm(t.header.raw`${this.name}`, t.raw`${this.getBody(player)}${this.defaultBody(player)}`)
    this.getMenu(menu, player)
    menu.show(player)
  }
}
