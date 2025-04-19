import { Player } from '@minecraft/server'
import { MessageForm } from 'lib/form/message'
import { MaybeRawText, t } from 'lib/text'
import { Cost } from './cost'
import { CostType } from './cost/cost'
import { Shop } from './shop'

export type ProductName = MaybeRawText | ((canBuy: boolean) => MaybeRawText)

type ProductOnBuy = (
  player: Player,
  text: MaybeRawText,
  successBuy: VoidFunction,
  successBuyText: MaybeRawText,
) => void | false

type BackFormWithMessage = (message?: MaybeRawText) => void

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
  text = t.options({ unit: this.canBuy ? '§f' : '§7' })
    .raw`§l${this.name}§r\n${this.cost.toString(this.canBuy, this.player)}`

  private ensurePlayerCanBuy() {
    if (this.cost.has(this.player)) return true

    this.backForm(
      t.raw`${t.error`Покупка невозможна:${this.cost.multiline ? '\n' : ' '}`}${this.cost.failed(this.player)}`,
    )
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

  private costString = this.cost.toString(true)

  private prompt() {
    const { player, sell, name, backForm, costString } = this

    new MessageForm(
      t.header`Подтверждение`,
      sell ? t.raw`Продать ${costString}§r§7 за ${name}§r§7?` : t.raw`Купить ${name}§r§7 за ${costString}§r§7?`,
    )
      .setButton1(sell ? t`Продать!` : t`Купить!`, this.buy)
      .setButton2(t.error`Отмена`, () => backForm(sell ? t.error`Продажа отменена` : t.error`Покупка отменена`))
      .show(player)
  }

  private buy = () => {
    if (!this.ensurePlayerCanBuy()) return

    const { sell, name, costString } = this
    const successBuyText = sell
      ? t.options({ text: '§a' }).raw`Успешная продажа ${name} за ${costString}!`
      : t.options({ text: '§a' }).raw`Успешная покупка ${name} за ${costString}!`

    const successBuy = () => this.backForm(successBuyText)

    if (this.onBuy(this.player, name, successBuy, successBuyText) !== false) successBuy()
  }

  onBuy: ProductOnBuy = (...args) =>
    this.takeCost ? (this.cost.take(this.player), this.onProductBuy(...args)) : this.onProductBuy(...args)
}
