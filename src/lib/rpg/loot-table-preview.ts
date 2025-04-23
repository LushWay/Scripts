import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { getAuxOrTexture } from 'lib/form/chest'
import { form } from 'lib/form/new'
import { itemDescription } from 'lib/shop/rewards'
import { MaybeRawText, t } from 'lib/text'
import { translateEnchantment } from 'lib/utils/lang'
import { LootTable } from './loot-table'

export const lootTablePreview = (lootTable: LootTable, name: MaybeRawText = t.header`Содержимое`, one = false) => {
  const previewItems = form(f => {
    f.title(name)

    const maxPercent = one
      ? lootTable.items.reduce((p, c) => p + c.chance, 0)
      : Math.max(...lootTable.items.map(p => p.chance))
    for (const item of lootTable.items) {
      const { amount, enchantments, itemStack: i } = item
      const itemStack = typeof i === 'function' ? i() : i
      const name = itemDescription(itemStack, '', false)
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
        t.raw`${name}\n${'§r§7' + (~~((item.chance / maxPercent) * 100)).toString()}§7%%${amountText}${enchantmentsText}`,
        getAuxOrTexture(itemStack.typeId, enchanted),
        itemForm(item),
      )
    }
  })

  const itemForm = (item: (typeof lootTable.items)[number]) =>
    form(f => {
      const i = typeof item.itemStack === 'function' ? item.itemStack() : item.itemStack
      f.title(itemDescription(i, '', false))
    })

  return previewItems
}

new Command('loottable')
  .setPermissions('techAdmin')
  .setDescription('Просмотр таблицы лута')
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
