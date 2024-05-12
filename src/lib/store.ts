import { ItemStack, Player, system } from '@minecraft/server'

import { EditableLocation, PlaceAction, Settings } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { Cost } from 'lib/cost'
import { EditableNpc } from 'lib/editable-npc'
import { EventSignal } from 'lib/event-signal'
import { ActionForm } from 'lib/form/action'
import { MessageForm } from 'lib/form/message'
import { itemDescription } from './rewards'

interface StoreOptions {
  name: string
  body: (p: Player) => string
}

export class Store {
  static block(options: StoreOptions & { dimensionId: Dimensions }) {
    /** We dont actually want to store that on disk */
    const cooldownDatabase: Record<string, any> = {}
    const store = new Store(options)
    const location = new EditableLocation(options.name + ' магазин').safe

    location.onLoad.subscribe(location => {
      PlaceAction.onInteract(
        location,
        player => {
          system.delay(() => {
            const cooldown = new Cooldown(cooldownDatabase, 'store', player, 1000, false)
            if (cooldown.tellIfExpired()) {
              cooldown.start()
              store.open(player)
            }
          })
          return true
        },
        options.dimensionId,
      )
    })

    return store
  }

  static npc(options: StoreOptions & { dimensionId?: Dimensions; id: string }) {
    const store = new Store(options)
    const entity = new EditableNpc({
      ...options,
      onInteract(event) {
        store.open(event.player)
      },
    })

    return { store, entity }
  }

  static getPlayerSettings = Settings.player('Магазин', 'market', {
    prompt: {
      name: 'Подтверждение покупки',
      description: 'Определяет, включено ли подтверждение перед покупкой.',
      value: true,
    },
  })

  static stores: Store[] = []

  options

  private items: { cost: Cost; item: ItemStack | ((p: Player) => ItemStack) }[] = []

  events = {
    /** @type {EventSignal<Player>} */
    open: new EventSignal(),

    /** @type {EventSignal<Player>} */
    buy: new EventSignal(),

    /** @type {EventSignal<Player>} */
    beforeBuy: new EventSignal(),
  }

  constructor(options: Partial<StoreOptions>) {
    this.options = { ...this.defaultOptions, ...options }

    Store.stores.push(this)
  }

  get defaultOptions(): StoreOptions {
    return {
      name: 'Купить',
      body: p =>
        `§f§lПодтверждение перед покупкой: §r${
          Store.getPlayerSettings(p).prompt ? '§aвключено.' : '§cвыключено.'
        }\n§f§lВаш баланс: §r§6${p.scores.money}${emoji.money}`,
    }
  }

  /**
   * Adds item to menu
   *
   * @param item
   * @param cost
   */
  addItem(item: ItemStack | ((p: Player) => ItemStack), cost: Cost) {
    this.items.push({ item, cost })
    return this
  }

  /** @param {{ cost: Cost; item: ItemStack; player: Player }} options */
  private buy({ item, cost, player }: { cost: Cost; item: ItemStack; player: Player }) {
    if (!cost.check(player)) {
      return this.open(player, `${cost.failed(player)}§r\n \n`)
    }

    const finalBuy = () => {
      if (!cost.check(player)) {
        return this.open(player, `${cost.failed(player)}§r\n \n`)
      }
      cost.buy(player)
      player.container?.addItem(item)
      this.open(player, `§aУспешная покупка §f${itemDescription(item)} §aза ${cost.string()}§a!\n \n§r`)
    }

    if (Store.getPlayerSettings(player).prompt) {
      new MessageForm('Подтверждение', `§fКупить ${itemDescription(item)} §fза ${cost.string()}?`)
        .setButton1('§aКупить!', finalBuy)
        .setButton2('§cОтмена', () => this.open(player, '§cПокупка отменена§r\n \n')) // §r
        .show(player)
    } else finalBuy()
  }

  /**
   * Opens store menu to player
   *
   * @param player
   * @param message
   */
  open(player: Player, message = '') {
    const form = new ActionForm(this.options.name, message + this.options.body(player))
    for (const { item, cost } of this.items) {
      const canBuy = cost.check(player)
      const itemStack = typeof item === 'function' ? item(player) : item

      form.addButton(
        `${canBuy ? '' : '§7'}${itemDescription(itemStack, canBuy ? '§g' : '§7', true)}${cost.string(canBuy)}`,
        () => this.buy({ item: itemStack, cost, player }),
      )
    }

    form.show(player)
  }
}
