import { ItemStack } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { BUTTON, getAuxOrTexture } from 'lib'
import { t } from 'lib/text'
import { ItemCost, MoneyCost } from '../cost'
import { ShopForm, ShopFormSection } from '../form'
import { itemDescription } from '../rewards'
import { Shop } from '../shop'
import { ErrorCost } from '../cost/cost'

export function createSellableItem({
  form,
  shop,
  type,
  count,
  maxCount,
  minPrice,
}: {
  shop: Shop
  form: ShopForm
  type: MinecraftItemTypes
  count: number
  maxCount: number
  minPrice: number
}) {
  const aux = getAuxOrTexture(type)
  form.section(
    itemDescription({ typeId: type, amount: 0 }),
    form => {
      const getBuy = () => ~~((maxCount / count) * minPrice)
      const buy = getBuy()
      const db = ShopForm.database[shop.id]
      const original = form.body.bind(form)

      form.body = () => t.raw`${original()}\nТовара на складе: ${t`${db[type] ?? 0}/${maxCount}`}`
      form.section(
        '§3Продать',
        form => {
          const buy = getBuy()
          const sell = ~~(buy / 2)
          const addSell = createSell(type, form, sell, db, maxCount, aux)
          addSell(1)
          addSell(10)
          addSell(20)
          addSell(100)
        },
        BUTTON['+'],
      )

      const addBuy = createBuy(buy, form, type, db, aux)
      addBuy(1)
      addBuy(10)
      addBuy(20)
      addBuy(100)
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
    const cost = new MoneyCost(buy * count)
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
    form.product(
      // Name
      new MoneyCost(sell * count).toString(),

      // Cost
      count + (db[type] ?? 0) > maxCount ? TooMuchItems : cost,

      // Actoin
      player => {
        cost.buy(player)

        db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
        player.scores.money += sell * count
      },
      aux,
      true,
    )
  }
}
