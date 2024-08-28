import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { BUTTON, getAuxOrTexture } from 'lib'
import { t } from 'lib/text'
import { ItemCost, MoneyCost } from '../cost'
import { ErrorCost } from '../cost/cost'
import { ShopForm, ShopFormSection } from '../form'
import { itemDescription } from '../rewards'
import { Shop } from '../shop'

export function createSellableItem({
  form,
  shop,
  type,
  defaultCount,
  maxCount,
  minPrice,
}: {
  shop: Shop
  form: ShopForm
  type: MinecraftItemTypes
  defaultCount: number
  maxCount: number
  minPrice: number
}) {
  const aux = getAuxOrTexture(type)
  form.section(
    itemDescription({ typeId: type, amount: 0 }),
    form => {
      const db = ShopForm.database[shop.id]
      const getBuy = () => {
        const count = db[type] ?? defaultCount
        return (maxCount / count) * minPrice
      }
      const buy = getBuy()
      const original = form.body.bind(form)

      form.body = () => t.raw`${original()}\nТовара на складе: ${t`${db[type] ?? 0}/${maxCount}`}`
      form.section(
        '§3Продать',
        form => {
          const buy = getBuy()
          const sell = buy / 2
          const addSell = createSell(type, form, sell, db, maxCount, aux)
          addSell(1)
          addSell(10)
          addSell(20)
          addSell(100)
          addSell(500)
        },
        BUTTON['+'],
      )

      const addBuy = createBuy(buy, form, type, db, aux)
      addBuy(1)
      addBuy(10)
      addBuy(20)
      addBuy(100)
      addBuy(500)
    },
    aux,
  )
}

const TooMuchItems = ErrorCost(t.error`Склад переполнен`)
const NoItemsToSell = ErrorCost(t.error`Товар закончился`)

function createBuy(
  buy: number,
  form: ShopFormSection,
  type: MinecraftItemTypes,
  db: Record<string, number | undefined>,
  aux: string,
) {
  return (count = 1) => {
    const total = ~~(buy * count)
    if (total <= 0) return
    const cost = new MoneyCost(total)
    form.product(
      // Name
      itemDescription({ typeId: type, amount: count }),

      // Cost
      (db[type] ?? 0) - count < 0 ? NoItemsToSell : cost,

      // Action
      player => {
        if (!player.container) return

        cost.buy(player)
        db[type] = Math.max(0, (db[type] ?? count) - count)
        player.container.addItem(new ItemStack(type, count))
      },
      aux,
      undefined,
      false,
    )
  }
}

function createSell(
  type: MinecraftItemTypes,
  form: ShopFormSection,
  sell: number,
  db: Record<string, number | undefined>,
  maxCount: number,
  aux: string,
) {
  return (count = 1) => {
    const cost = new ItemCost(type, count)
    const total = ~~(sell * count)
    if (total <= 0) return
    form.product(
      // Name
      new MoneyCost(total).toString(),

      // Cost
      count + (db[type] ?? 0) > maxCount ? TooMuchItems : cost,

      // Actoin
      player => {
        db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
        player.scores.money += sell * count
      },
      aux,
      true,
    )
  }
}
