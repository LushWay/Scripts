import { ItemStack, Player, system } from '@minecraft/server'
import { SOUNDS } from 'config.js'
import { Cooldown } from 'lib/Class/Cooldown.js'
import { EditableNpc } from 'lib/Class/EditableNpc.js'
import { EventSignal } from 'lib/Class/EventSignal.js'
import { GAME_UTILS } from 'lib/Class/GameUtils.js'
import { ActionForm } from 'lib/Form/ActionForm.js'
import { MessageForm } from 'lib/Form/MessageForm.js'
import { EditableLocation, PlaceAction } from 'smapi.js'

class Cost {
  /**
   * Returns string representation of cost
   * @returns {string}
   */
  string(canBuy = true) {
    return ''
  }
  /**
   * If the player have this cost returns true, otherwise false
   * @param {Player} player
   * @returns {boolean}
   */
  check(player) {
    return false
  }
  /**
   * Removes this cost from player
   * @param {Player} player
   */
  buy(player) {
    player.playSound(SOUNDS.action)
  }
  /**
   * Returns fail info for player
   * @param {Player} player
   * @returns {string}
   */
  failed(player) {
    player.playSound(SOUNDS.fail)
    return 'Недостаточно средств'
  }
}

class ScoreboardCost extends Cost {
  constructor(cost = 1) {
    super()
    this.cost = cost
  }

  /**
   * @type {import('@minecraft/server').ScoreName}
   */
  scoreboard = 'money'

  string(canBuy = true) {
    return `${canBuy ? '§6' : '§c'}${this.cost}M`
  }
  /**
   * @param {Player} player
   */
  check(player) {
    return player.scores[this.scoreboard] >= this.cost
  }

  /**
   * @param {Player} player
   */
  buy(player) {
    player.scores[this.scoreboard] -= this.cost
    super.buy(player)
  }

  /**
   * @param {Player} player
   */
  failed(player) {
    super.failed(player)
    const money = player.scores[this.scoreboard]
    return `§cНедостаточно средств (§4${money}/${this.cost}§c). Нужно еще §6${this.cost - money}`
  }
}

export class MoneyCost extends ScoreboardCost {
  /** @type {import('@minecraft/server').ScoreName} */
  scoreboard = 'money'
}

export class LeafyCost extends ScoreboardCost {
  /** @type {import('@minecraft/server').ScoreName} */
  scoreboard = 'leafs'
}

export class ItemCost extends Cost {}

/**
 * @typedef {object} StoreOptions
 * @prop {string} name - Title of the store form.
 * @prop {(p: Player) => string} body - Body of the store form.
 * @prop {boolean} prompt - Whenever ask user before buy or not.
 */

export class Store {
  /**
   * @param {StoreOptions & { dimensionId?: Dimensions }} options
   */
  static block(options) {
    const location = new EditableLocation(options.name + ' магазин').safe
    /**
     * We dont actually want to store that on disk
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
        options.dimensionId
      )
    })

    return store
  }

  /**
   * @param {StoreOptions & { dimensionId?: Dimensions, id: string }} options
   */
  static npc(options) {
    const store = new Store(options)
    const npc = new EditableNpc({
      ...options,
      onInteract(event) {
        store.open(event.player)
      },
    })

    return { store, npc }
  }
  /**
   * @type {Store[]}
   */
  static stores = []

  /**
   * @type {Array<{cost: Cost, item: ItemStack | ((p: Player) => ItemStack)}>}
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

  /**
   * @param {Partial<StoreOptions>} [options]
   */
  constructor(options) {
    this.options = { ...this.defaultOptions, ...options }
    Store.stores.push(this)
  }

  /** @type {StoreOptions} */
  get defaultOptions() {
    return {
      name: 'Купить',
      body: p =>
        `${
          this.options.prompt ? 'Подтверждение перед покупкой §aесть.' : 'Подтверждения перед покупкой §cнет.'
        }\n§fБаланс: §6${p.scores.money}M`,
      prompt: true,
    }
  }

  /**
   * Adds item to menu
   * @param {ItemStack | ((p: Player) => ItemStack)} item
   * @param {Cost} cost
   */
  addItem(item, cost) {
    this.items.push({ item, cost })
    return this
  }
  /**
   *
   * @param {{cost: Cost, item: ItemStack, player: Player}} data
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

    // TODO Move to player options
    if (this.options.prompt) {
      new MessageForm('Подтверждение', `§fКупить ${itemDescription(item)} §fза ${cost.string()}?`)
        .setButton1('§aКупить!', finalBuy)
        .setButton2('§cОтмена', () => this.open(player, '§cПокупка отменена§r\n \n')) // §r
        .show(player)
    } else finalBuy()
  }
  /**
   * Opens store menu to player
   * @param {Player} player
   */
  open(player, message = '') {
    const form = new ActionForm(this.options.name, message + this.options.body(player))
    for (const { item, cost } of this.items) {
      const canBuy = cost.check(player)
      const itemStack = typeof item === 'function' ? item(player) : item
      form.addButton(
        `${canBuy ? '' : '§7'}${itemDescription(itemStack, canBuy ? '§g' : '§7')}\n${cost.string(canBuy)}`,
        () => this.buy({ item: itemStack, cost, player })
      )
    }

    form.show(player)
  }
}

/**
 * Returns <item name> x<count>
 * @param {ItemStack} item
 */
function itemDescription(item, c = '§g') {
  return `${item.nameTag ?? GAME_UTILS.localizationName(item)}§r${item.amount ? ` ${c}x${item.amount}` : ''}`
}
