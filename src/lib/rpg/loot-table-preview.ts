import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { getAuxOrTexture } from 'lib/form/chest'
import { form } from 'lib/form/new'
import { translateEnchantment } from 'lib/i18n/lang'
import { MaybeRawText, t } from 'lib/i18n/text'
import { itemNameXCount } from 'lib/utils/item-name-x-count'
import { LootTable } from './loot-table'

export const lootTablePreview = (lootTable: LootTable, name: MaybeRawText = t.header`Содержимое`, one = false) => {
  const previewItems = form(f => {
    f.title(name)

    const maxPercent = one
      ? lootTable.items.reduce((p, c) => p + c.weight, 0)
      : Math.max(...lootTable.items.map(p => p.weight))
    for (const item of lootTable.items) {
      const { amount, enchantments, itemStack: i } = item
      const itemStack = typeof i === 'function' ? i() : i
      const name = itemNameXCount(itemStack, '', false)
      const amountText = amount[0] === amount.at(-1) ? '' : ` x${amount[0]}...${amount.at(-1)} `
      const enchanted = !!Object.keys(enchantments).length
      const enchantmentsText = enchanted
        ? {
            rawtext: [
              { text: ' ' },
              ...Object.keys(enchantments)
                .map(e => translateEnchantment(e))
                .map(e => e.rawtext)
                .flat()
                .filter(e => typeof e === 'object'),
            ],
          }
        : ''

      f.button(
        t.raw`${name}\n${'§r§7' + (~~((item.weight / maxPercent) * 100)).toString()}§7%%${amountText}${enchantmentsText}`,
        getAuxOrTexture(itemStack.typeId, enchanted),
        itemForm(item),
      )
    }
  })

  const itemForm = (item: (typeof lootTable.items)[number]) =>
    form(f => {
      const i = typeof item.itemStack === 'function' ? item.itemStack() : item.itemStack
      f.title(itemNameXCount(i, '', false))
    })

  return previewItems
}

new Command('loottable')
  .setPermissions('techAdmin')
  .setDescription(t`Просмотр содержимого таблиц лута`)
  .executes(ctx => {
    lootTables(ctx.player)
  })

function lootTables(player: Player) {
  new ArrayForm('LootTable', LootTable.all)
    .filters({
      onlyWithId: {
        name: 'Only with id',
        description: 'Show only tables with ID',
        value: true,
      },
    })
    .button((table, settings, _, back) => {
      if (!table.id && settings.onlyWithId) return false
      return [
        table.id ?? t`Unkown table with ${table.items.length} items`,
        () => lootTablePreview(table).show(player, back),
      ] as const
    })
    .show(player)
}
