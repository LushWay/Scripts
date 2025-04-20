import { Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { getAuxOrTexture } from 'lib/form/chest'
import { BUTTON } from 'lib/form/utils'
import { is } from 'lib/roles'
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
  player,
  inventory,
}: {
  shop: Shop
  form: ShopForm
  type: MinecraftItemTypes
  defaultCount: number
  maxCount: number
  minPrice: number
  k: number
  player: Player
  inventory: Map<string, number>
}) {
  const aux = getAuxOrTexture(type)
  const db = ShopForm.database[shop.id]
  const getCount = () => Math.max(0, db[type] ?? defaultCount)
  const getBuy = (count = getCount()) => Math.max(1, shopFormula.formula(maxCount, count, minPrice, k))
  const body = () => {
    const storageAmount = t`${getCount()}/${maxCount}`
    const filledPercent = t`${((getCount() / maxCount) * 100).toFixed(2)}%%`
    return t.raw`Товара на складе: ${storageAmount}, ${filledPercent}`
  }
  const adminBody = () => {
    return t.raw`${body()}\n\nAdmin info below\n${t`DB count: ${db[type]}\nDefault count: ${defaultCount}`}`
  }
  const amount = inventory.get(type) ?? 0
  const settings = Shop.getPlayerSettings(player)

  form.section(
    itemDescription({ typeId: type, amount }),
    (form, player) => {
      const bodyFn = is(player.id, 'techAdmin') ? adminBody : body
      form.body = bodyFn
      form.section(
        '§3Продать',
        form => {
          form.body = bodyFn
          const addSell = createSell(getCount, getBuy, type, form, db, maxCount, aux)
          addSell(1)
          addSell(16)
          addSell(32)
          addSell(64)
          addSell(256)
          addSell(countItems(player, type))
        },
        BUTTON['+'],
      )

      function buyForm(form: ShopFormSection) {
        const addBuy = createBuy(getCount, getBuy, form, type, db, aux)
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
      }
      if (settings.sellableItemsScreen) {
        buyForm(form)
      } else {
        form.section('Купить', f => buyForm(f))
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
  getCount: () => number,
  getBuy: (n: number) => number,
  form: ShopFormSection,
  type: MinecraftItemTypes,
  db: Record<string, number | undefined>,
  aux: string,
) {
  const dbCount = getCount()
  return (buyCount = 1) => {
    const finalCost = getFinalCost(buyCount, i => getBuy(dbCount - i))
    const cost = finalCost <= 0 ? ImpossibleBuyCost : dbCount - buyCount < 0 ? NoItemsToSell : new MoneyCost(finalCost)

    form
      .product()
      .name(itemDescription({ typeId: type, amount: buyCount }))
      .cost(cost)
      .onBuy(player => {
        if (!player.container) return

        cost.take(player)
        console.log({ count: getCount(), buyCount, a: getCount() - buyCount, db: Math.max(0, getCount() - buyCount) })
        db[type] = Math.max(0, getCount() - buyCount)
        player.runCommand(`give @s ${type} ${buyCount}`)
      })
      .setTexture(aux)
      .setTakeCost(false)
  }
}

function createSell(
  getCount: () => number,
  getBuy: (n: number) => number,
  type: MinecraftItemTypes,
  form: ShopFormSection,
  db: Record<string, number | undefined>,
  maxCount: number,
  aux: string,
) {
  const dbCount = getCount()
  return (sellCount = 1) => {
    const finalCost = getFinalCost(sellCount, n => getBuy(dbCount + n) / 2)
    const cost = new MultiCost(
      finalCost <= 0 ? ImpossibleSellCost : sellCount + dbCount > maxCount ? TooMuchItems : FreeCost,
      new ItemCost(type, sellCount),
    )

    form
      .product()
      .name(new MoneyCost(finalCost).toString())
      .cost(cost)
      .onBuy(player => {
        db[type] = Math.min(maxCount, getCount() + sellCount)
        player.scores.money += finalCost
      })
      .setTexture(aux)
      .setSell(true)
  }
}

function getFinalCost(addCost: number, calculateCost: (n: number) => number) {
  let total = 0
  for (let i = 0; i < addCost; i++) total += calculateCost(i)
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
