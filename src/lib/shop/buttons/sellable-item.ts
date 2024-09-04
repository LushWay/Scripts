import { Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { getAuxOrTexture } from 'lib/form/chest'
import { BUTTON } from 'lib/form/utils'
import { t } from 'lib/text'
import { ItemCost, MoneyCost, MultiCost } from '../cost'
import { ErrorCost, FreeCost } from '../cost/cost'
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
  k,
}: {
  shop: Shop
  form: ShopForm
  type: MinecraftItemTypes
  defaultCount: number
  maxCount: number
  minPrice: number
  k: number
}) {
  const aux = getAuxOrTexture(type)
  const db = ShopForm.database[shop.id]
  const body = () =>
    t.raw`Товара на складе: ${t`${db[type] ?? 0}/${maxCount}`}, ${t`${(((db[type] ?? 0) / maxCount) * 100).toFixed(2)}%%`}`
  const getCount = () => Math.max(1, db[type] ?? defaultCount)
  const getBuy = (count = getCount()) => {
    return Math.max(1, shopFormula.formula(maxCount, count, minPrice, k))
  }

  form.section(
    itemDescription({ typeId: type, amount: 0 }),
    (form, player) => {
      form.body = body
      form.section(
        '§3Продать',
        form => {
          form.body = body
          const addSell = createSell(getCount(), getBuy, type, form, db, maxCount, aux)
          addSell(1)
          addSell(16)
          addSell(32)
          addSell(64)
          addSell(256)
          addSell(countItems(player, type))
        },
        BUTTON['+'],
      )

      const addBuy = createBuy(getCount(), getBuy, form, type, db, aux)
      addBuy(1)
      addBuy(16)
      addBuy(32)
      addBuy(64)
      addBuy(256)

      let money = player.scores.money
      let i = 0
      for (;;) {
        money -= getBuy(getCount() - i)
        if (money > 0 && getCount() - i > 0) {
          // More money, reduce
          i++
        } else {
          // No more money, add item
          if (i > 0) addBuy(i)
          break
        }
      }
    },
    aux,
  )
}

const TooMuchItems = ErrorCost(t.error`Склад переполнен`)
const NoItemsToSell = ErrorCost(t.error`Товар закончился`)
export const ImpossibleBuyCost = ErrorCost(t.error`Покупка невозможна`)
export const ImpossibleSellCost = ErrorCost(t.error`Продажа невозможна`)

function createBuy(
  dbCount: number,
  getBuy: (n: number) => number,
  form: ShopFormSection,
  type: MinecraftItemTypes,
  db: Record<string, number | undefined>,
  aux: string,
) {
  return (count = 1) => {
    const total = getTotal(count, i => getBuy(dbCount - i))
    const cost = total <= 0 ? ImpossibleBuyCost : dbCount - count < 0 ? NoItemsToSell : new MoneyCost(total)

    form
      .product()
      .name(itemDescription({ typeId: type, amount: count }))
      .cost(cost)
      .onBuy(player => {
        if (!player.container) return

        cost.buy(player)
        db[type] = Math.max(0, (db[type] ?? count) - count)
        player.runCommand(`give @s ${type} ${count}`)
      })
      .setTexture(aux)
      .setCustomCostBuy(true)
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
    const total = getTotal(count, n => getSell(dbCount + n) / 2)
    const cost = new MultiCost(
      total <= 0 ? ImpossibleSellCost : count + dbCount > maxCount ? TooMuchItems : FreeCost,
      new ItemCost(type, count),
    )

    form
      .product()
      .name(new MoneyCost(total).toString())
      .cost(cost)
      .onBuy(player => {
        db[type] = Math.min(maxCount, (db[type] ?? 0) + count)
        player.scores.money += total
      })
      .setTexture(aux)
  }
}

function getTotal(addCount: number, adder: (n: number) => number) {
  let total = 0
  for (let i = 0; i < addCount; i++) total += adder(i)
  return ~~total
}

function countItems(player: Player, type: string) {
  let count = 0
  if (!player.container) return 0
  for (const [, item] of player.container.entries()) {
    if (!item || item.typeId !== type) continue

    count += item.amount
  }
  return count
}
