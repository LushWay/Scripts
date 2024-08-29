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
      const getCount = () => Math.max(1, db[type] ?? defaultCount)
      const getBuy = (count = getCount()) => {
        return Math.max(1, (maxCount / count) * minPrice)
      }
      const original = form.body.bind(form)

      form.body = () => t.raw`${original()}\nТовара на складе: ${t`${db[type] ?? 0}/${maxCount}`}`
      form.section(
        '§3Продать',
        form => {
          const addSell = createSell(getCount(), getBuy, type, form, db, maxCount, aux)
          addSell(1)
          addSell(10)
          addSell(20)
          addSell(100)
          addSell(500)
        },
        BUTTON['+'],
      )

      const addBuy = createBuy(getCount(), getBuy, form, type, db, aux)
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
  dbCount: number,
  getBuy: (n: number) => number,
  form: ShopFormSection,
  type: MinecraftItemTypes,
  db: Record<string, number | undefined>,
  aux: string,
) {
  return (count = 1) => {
    let total = 0
    for (let i = 0; i <= count; i++) {
      total += getBuy(dbCount - i) / 2
    }
    total = ~~total

    const cost = total <= 0 || dbCount - count < 0 ? NoItemsToSell : new MoneyCost(total)
    form.product(
      itemDescription({ typeId: type, amount: count }),
      cost,
      player => {
        if (!player.container) return

        cost.buy(player)
        db[type] = Math.max(0, (db[type] ?? count) - count)
        player.runCommand(`give @s ${type} ${count}`)
      },
      aux,
      undefined,
      false,
    )
  }
}

function createSell(
  dbCount: number,
  getSell: (n: number) => number,
  type: MinecraftItemTypes,
  form: ShopFormSection,
  db: Record<string, number | undefined>,
  maxCount: number,
  aux: string,
) {
  return (count = 1) => {
    let total = 0
    for (let i = 0; i <= count; i++) {
      total += getSell(dbCount + i)
    }
    total = ~~total

    const cost = total <= 0 || count + dbCount > maxCount ? TooMuchItems : new ItemCost(type, count)
    form.product(
      new MoneyCost(total).toString(),
      cost,
      player => {
        db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
        player.scores.money += total
      },
      aux,
      true,
    )
  }
}
