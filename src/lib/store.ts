import { ItemStack, Player, system } from '@minecraft/server'

import { PlaceAction, Settings, location, migrateLocationName } from 'lib'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { Cost } from 'lib/cost'
import { EditableNpc } from 'lib/editable-npc'
import { ActionForm } from 'lib/form/action'
import { MessageForm } from 'lib/form/message'
import { itemDescription } from './rewards'

interface StoreOptions {
  group: string
  name: string
  body: (p: Player) => string
}

export class Store {
  static block(options: StoreOptions & { dimensionId: Dimensions }) {
    const store = new Store(options)
    migrateLocationName(options.name + ' магазин', options.group, options.name)
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

  static getPlayerSettings = Settings.player('Магазин\n§7Внутриигровой магазин', 'market', {
    prompt: {
      name: 'Подтверждение покупки',
      description: 'Определяет, включено ли подтверждение перед покупкой.',
      value: true,
    },
  })

  static stores: Store[] = []

  private options: StoreOptions

  private items: { cost: Cost; item: ItemStack | ((p: Player) => ItemStack) }[] = []

  constructor(options: Partial<StoreOptions>) {
    this.options = { ...this.defaultOptions, ...options }

    Store.stores.push(this)
  }

  get defaultOptions(): StoreOptions {
    return {
      group: 'Продавцы',
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

  private buy({ item, cost, player }: { cost: Cost; item: ItemStack; player: Player }) {
    const canBuy = () => {
      if (!cost.check(player)) {
        this.open(player, `${cost.failed(player)}§r\n \n`)
        return false
      } else return true
    }

    if (!canBuy()) return

    if (Store.getPlayerSettings(player).prompt) {
      new MessageForm('Подтверждение', `§fКупить ${itemDescription(item)} §fза ${cost.string()}?`)
        .setButton1('§aКупить!', purchase)
        .setButton2('§cОтмена', () => this.open(player, '§cПокупка отменена§r\n \n')) // §r
        .show(player)
    } else purchase()

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    function purchase() {
      if (!canBuy() || !player.container) return
      cost.buy(player)
      player.container.addItem(item)
      self.open(player, `§aУспешная покупка §f${itemDescription(item)} §aза ${cost.string()}§a!\n \n§r`)
    }
  }
}
