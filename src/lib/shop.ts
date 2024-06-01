import { ContainerSlot, ItemStack, Player, system } from '@minecraft/server'
import { MinecraftBlockTypes } from '@minecraft/vanilla-data'
import { PlaceAction } from 'lib/action'
import { emoji } from 'lib/assets/emoji'
import { Cooldown } from 'lib/cooldown'
import { Cost, MultiCost, ShouldHaveItemCost } from 'lib/cost'
import { ActionForm } from 'lib/form/action'
import { ChestForm } from 'lib/form/chest'
import { MessageForm } from 'lib/form/message'
import { location } from 'lib/location'
import { Npc } from 'lib/npc'
import { Settings } from 'lib/settings'
import { MaybeRawText, t, textTable } from 'lib/text'
import { BUTTON } from './form/utils'
import { typeIdToReadable } from './game-utils'
import { itemDescription } from './rewards'

interface ShopOptions {
  group: string
  name: string
  body: (player: Player) => string
}

interface ShopProduct<T = unknown> {
  name: MaybeRawText | ((canBuy: boolean) => MaybeRawText)
  cost: Cost<T>
  onBuy: (player: Player, text: MaybeRawText, successBuy: VoidFunction) => void | false
}

interface ShopSection {
  name: MaybeRawText
  onOpen: (form: ShopForm) => void
}

type ShopProductBuy = Omit<ShopProduct, 'name'> & {
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

export class ShopForm {
  private buttons: (ShopProduct | ShopSection)[] = []

  constructor(
    private title: MaybeRawText,
    private body: MaybeRawText,
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

  /**
   * Adds buyable item to shop menu
   *
   * @param item
   * @param cost
   */
  addItemStack(item: ItemStack, cost: Cost) {
    this.addProduct(itemDescription(item, '§f'), cost, player => {
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
    const form = new ActionForm(this.title, t.raw`${message}${message ? '§r\n \n§f' : ''}${this.body}`)
    if (back) form.addButtonBack(back)

    for (const button of this.buttons) {
      if ('cost' in button) {
        const { name, cost, onBuy } = button
        const canBuy = cost.has(player)
        const text = typeof name === 'function' ? name(canBuy) : name

        form.addButton(
          t.options({ unitColor: canBuy ? '§f' : '§7' }).raw`§l${text}§r\n${cost.toString(canBuy, player)}`,
          () => this.buy({ text: text, cost, onBuy, player, back }),
        )
      } else {
        const { name, onOpen } = button

        form.addButton(name, () => {
          const form = new ShopForm(t.header.raw`${this.title} > ${name}`, this.body)
          onOpen(form)
          form.show(player, '', () => this.show(player))
        })
      }
    }

    form.show(player)
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
        this.show(player, t.options({ textColor: '§a' }).raw`Успешная покупка: ${text} за ${cost.toString()}!`)

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
