import { Player } from '@minecraft/server'
import { developersAreWarned } from 'lib/assets/text'
import { MessageForm } from 'lib/form/message'
import { i18n } from 'lib/i18n/text'
import { Cost } from './cost'
import { CostType } from './cost/cost'
import { Shop } from './shop'

export type ProductName = Text | ((canBuy: boolean) => Text)

type ProductOnBuy = (player: Player, text: Text, successBuy: VoidFunction, successBuyText: Text) => void | false

type BackFormWithMessage = (message?: Text) => void

type OnProductCreate<T> = (product: Product) => T

export class Product<T extends Cost = any> {
  static create<C extends Cost>() {
    let onCreateCallback: OnProductCreate<any> = s => s

    return {
      creator<P>(onCreate: OnProductCreate<P>, form: BackFormWithMessage) {
        onCreateCallback = onCreate
        return this.form<P>(form)
      },
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
      form: <P = Product<C>>(backForm: BackFormWithMessage) => ({
        player: (player: Player) => ({
          name: (name: ProductName) => ({
            cost: (cost: C) => ({
              onBuy: (onBuy: ProductOnBuy) => {
                const shop = new Product<C>(name, cost, player, onBuy, backForm)
                return (onCreateCallback as OnProductCreate<P>)(shop)
              },
            }),
          }),
        }),
      }),
    }
  }

  private constructor(
    private nameGenerator: ProductName,
    private cost: T,
    private player: Player,
    private onProductBuy: ProductOnBuy,
    /** Texture represnting product */
    private backForm: BackFormWithMessage,
  ) {}

  private sell = false

  setSell(value: boolean) {
    this.sell = value
    return this
  }

  private takeCost = true

  setTakeCost(value: boolean) {
    this.takeCost = value
    return this
  }

  public texture?: string

  setTexture(texture: string) {
    this.texture = texture
    return this
  }

  private canBuy = this.cost.has(this.player)

  private name = typeof this.nameGenerator === 'function' ? this.nameGenerator(this.canBuy) : this.nameGenerator

  /** Name of this product. Includes cost. */
  // TODO Fix colors
  text = i18n.restyle({
    unit: this.canBuy ? '§f' : '§7',
  })`§l${this.name}§r\n${this.cost.toString(this.player, this.canBuy)}`

  private ensurePlayerCanBuy() {
    if (this.cost.has(this.player)) return true

    this.backForm(i18n.error`Покупка невозможна:${this.cost.multiline ? '\n' : ' '}${this.cost.failed(this.player)}`)
    return false
  }

  /** Function that should be called when user tries to buy this product */
  callback = () => {
    if (!this.ensurePlayerCanBuy()) return

    const { cost, player } = this
    if (Shop.getPlayerSettings(player).prompt && cost.type === CostType.Action) {
      this.prompt()
    } else this.buy()
  }

  /* Action form button that represents this product */
  get button() {
    return [this.text, this.texture, this.callback] as const
  }

  private prompt() {
    const { player, sell, name, backForm } = this
    const costString = this.cost.toString(player, true)

    new MessageForm(
      i18n.header`Подтверждение`.to(player.lang),
      (sell ? i18n`Продать ${costString} за ${name}?` : i18n`Купить ${name} за ${costString}?`).to(player.lang),
    )
      .setButton1((sell ? i18n`Продать!` : i18n`Купить!`).to(player.lang), this.buy)
      .setButton2(i18n.error`Отмена`.to(player.lang), () =>
        backForm(sell ? i18n.error`Продажа отменена` : i18n.error`Покупка отменена`),
      )
      .show(player)
  }

  private buy = () => {
    if (!this.ensurePlayerCanBuy()) return

    const { sell, name } = this
    const costString = this.cost.toString(this.player, true)
    const successBuyText = sell
      ? i18n.success`Успешная продажа ${name} за ${costString}!`
      : i18n.success`Успешная покупка ${name} за ${costString}!`

    const successBuy = () => this.backForm(successBuyText)

    if (this.onBuy(this.player, name, successBuy, successBuyText) !== false) successBuy()
  }

  onBuy: ProductOnBuy = this.takeCost
    ? wrapWithCatch((...args) => {
        const result = this.onProductBuy(...args)
        this.cost.take(this.player)
        return result
      }, this.player)
    : wrapWithCatch(this.onProductBuy.bind(this), this.player)
}

function wrapWithCatch<T extends (...args: any[]) => unknown>(func: T, player: Player): T {
  return ((...args) => {
    try {
      return func(...(args as Parameters<T>))
    } catch (e) {
      new MessageForm(
        i18n`Ошибка`.to(player.lang),
        i18n`При покупке произошла ошибка. ${developersAreWarned}`.to(player.lang),
      ).show(player)

      throw e
    }
  }) as T
}
