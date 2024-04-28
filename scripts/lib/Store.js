import { ItemStack, Player, system } from '@minecraft/server'
import { EditableLocation, PlaceAction, Settings, itemLocaleName } from 'lib.js'
import { emoji } from 'lib/Assets/emoji.js'
import { Cooldown } from 'lib/Cooldown.js'
import { Cost } from 'lib/Cost.js'
import { EditableNpc } from 'lib/EditableNpc.js'
import { EventSignal } from 'lib/EventSignal.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'

/**
 * @typedef {object} StoreOptions
 * @property {string} name - Title of the store form.
 * @property {(p: Player) => string} body - Body of the store form.
 */

export class Store {
  /** @param {StoreOptions & { dimensionId?: Dimensions }} options */
  static block(options) {
    const location = new EditableLocation(options.name + ' магазин').safe
    /**
     * We dont actually want to store that on disk
     *
     * @type {Record<string, any>}
     */
    const cooldownDatabase = {}
    const store = new Store(options)

    location.onLoad.subscribe(location => {
      PlaceAction.onInteract(
        location,
        player => {
          system.delay(() => {
            const cooldown = new Cooldown(cooldownDatabase, 'store', player, 1000, false)
            if (cooldown.tellIfExpired()) {
              cooldown.update()
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

  /** @param {StoreOptions & { dimensionId?: Dimensions; id: string }} options */
  static npc(options) {
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

  /** @type {Store[]} */
  static stores = []

  /**
   * @private
   * @type {{ cost: Cost; item: ItemStack | ((p: Player) => ItemStack) }[]}
   */
  items = []

  events = {
    /** @type {EventSignal<Player>} */
    open: new EventSignal(),

    /** @type {EventSignal<Player>} */
    buy: new EventSignal(),

    /** @type {EventSignal<Player>} */
    beforeBuy: new EventSignal(),
  }

  /** @param {Partial<StoreOptions>} [options] */
  constructor(options) {
    this.options = { ...this.defaultOptions, ...options }
    Store.stores.push(this)
  }

  /** @type {StoreOptions} */
  get defaultOptions() {
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
   * @param {ItemStack | ((p: Player) => ItemStack)} item
   * @param {Cost} cost
   */
  addItem(item, cost) {
    this.items.push({ item, cost })
    return this
  }
  /**
   * @private
   * @param {{ cost: Cost; item: ItemStack; player: Player }} options
   */
  buy({ item, cost, player }) {
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
   * @param {Player} player
   */
  open(player, message = '') {
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

/**
 * Returns <item name>\nx<count>
 *
 * @param {ItemStack} item
 */
function itemDescription(item, c = '§g', newline = false) {
  return `${item.nameTag ?? itemLocaleName(item)}§r${newline ? '\n' : ''}${
    item.amount ? `${newline ? '' : ' '}${c}x${item.amount}${newline ? ' ' : ''}` : ''
  }`
}
