import { ItemStack, Player } from '@minecraft/server'
import { MinecraftItemTypes } from '@minecraft/vanilla-data'
import { shopFormula } from 'lib/assets/shop'
import { getAuxOrTexture } from 'lib/form/chest'
import { BUTTON } from 'lib/form/utils'
import { i18n, noI18n } from 'lib/i18n/text'
import { is } from 'lib/roles'
import { itemNameXCount } from '../../utils/item-name-x-count'
import { ItemCost, MoneyCost, MultiCost } from '../cost'
import { ErrorCost, FreeCost } from '../cost/cost'
import { ShopForm, ShopFormSection } from '../form'
import {
  getFreeSpaceForItemInInventory,
  ImpossibleBuyCost,
  ImpossibleSellCost,
  InventoryFull,
} from '../sell-buy-errors'
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
  const db = ShopForm.database.get(shop.id)
  const getCount = () => Math.max(0, db[type] ?? defaultCount)
  const getBuy = (count = getCount()) => Math.max(1, shopFormula.formula(maxCount, count, minPrice, k))
  const body = () => {
    const count = getCount()
    return i18n`Товара на складе: ${count}/${maxCount}, ${((count / maxCount) * 100).toFixed(2)}%%`
  }
  const adminBody = () => {
    return noI18n`${body()}\n\nAdmin info below\n${i18n`DB count: ${db[type]}\nDefault count: ${defaultCount}`}`
  }
  const amount = inventory.get(type) ?? 0
  const settings = Shop.getPlayerSettings(player)

  form.section(
    itemNameXCount({ typeId: type, amount }, undefined, undefined, player),
    (form, player) => {
      const bodyFn = is(player.id, 'techAdmin') ? adminBody : body
      form.body = bodyFn
      form.section(
        i18n.accent`Продать`.size(amount),
        form => {
          form.body = bodyFn
          const addSell = createSell(getCount, getBuy, type, form, db, maxCount, aux, player)
          addSell(1)
          addSell(16)
          addSell(32)
          addSell(64)
          addSell(256)
          addSell(countItems(player, type))
        },
        BUTTON['-'],
      )

      function buyForm(form: ShopFormSection) {
        const addBuy = createBuy(getCount, getBuy, form, type, db, aux, player)
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
        form.section(i18n.accent`Купить`, f => buyForm(f), BUTTON['+'])
      }
    },
    aux,
  )
}

const TooMuchItems = ErrorCost(i18n.error`Склад переполнен`)
const NoItemsToSell = ErrorCost(i18n.error`Товар закончился`)
function createBuy(
  getCount: () => number,
  getBuy: (n: number) => number,
  form: ShopFormSection,
  type: MinecraftItemTypes,
  db: Record<string, number | undefined>,
  aux: string,
  player: Player,
) {
  const dbCount = getCount()
  const space = getFreeSpaceForItemInInventory(player, new ItemStack(type))
  return (buyCount = 1) => {
    const finalCost = getFinalCost(buyCount, i => getBuy(dbCount - i))

    let cost = ErrorCost('Unknown Cost')

    if (space < buyCount) cost = InventoryFull(buyCount - space)
    else if (finalCost <= 0) cost = ImpossibleBuyCost
    else if (dbCount - buyCount < 0) cost = NoItemsToSell
    else cost = new MoneyCost(finalCost)

    form
      .product()
      .name(itemNameXCount({ typeId: type, amount: buyCount }, undefined, undefined, player))
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
  player: Player,
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
      .name(new MoneyCost(finalCost).toString(player))
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
