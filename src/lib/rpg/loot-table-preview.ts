import { Player } from '@minecraft/server'
import { ArrayForm } from 'lib/form/array'
import { getAuxOrTexture } from 'lib/form/chest'
import { form } from 'lib/form/new'
import { translateEnchantment } from 'lib/i18n/lang'
import { I18nMessage } from 'lib/i18n/message'
import { i18n } from 'lib/i18n/text'
import { itemNameXCount } from 'lib/utils/item-name-x-count'
import { LootTable } from './loot-table'

// TODO Fix colors
export const lootTablePreview = form.params<{ lootTable: LootTable; name?: I18nMessage; one?: boolean }>(
  (f, { player, params: { lootTable, name = i18n.header`Содержимое`, one = false } }) => {
    f.title(name)

    const itemForm = form.params<{ item: (typeof lootTable.items)[number] }>((f, { player, params: { item } }) => {
      const i = typeof item.itemStack === 'function' ? item.itemStack() : item.itemStack
      f.title(itemNameXCount(i, '', false, player))
    })

    const maxPercent = one
      ? lootTable.items.reduce((p, c) => p + c.weight, 0)
      : Math.max(...lootTable.items.map(p => p.weight))
    for (const item of lootTable.items) {
      const { amount, enchantments, itemStack: i } = item
      const itemStack = typeof i === 'function' ? i() : i
      const name = itemNameXCount(itemStack, '', false, player)
      const amountText = amount[0] === amount.at(-1) ? '' : ` x${amount[0]}...${amount.at(-1)} `
      const enchanted = !!Object.keys(enchantments).length
      const enchantmentsText = enchanted
        ? ' ' +
          Object.keys(enchantments)
            .map(e => translateEnchantment(e, player.lang))
            .join('\n')
        : ''

      f.button(
        i18n`${name}\n${'§r§7' + (~~((item.weight / maxPercent) * 100)).toString()}§7%%${amountText}${enchantmentsText}`,
        getAuxOrTexture(itemStack.typeId, enchanted),
        itemForm({ item }),
      )
    }
  },
)

new Command('loottable')
  .setPermissions('techAdmin')
  .setDescription(i18n`Просмотр содержимого таблиц лута`)
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
        table.id ?? i18n`Unkown table with ${table.items.length} items`,
        () => lootTablePreview({ lootTable: table }).show(player, back),
      ] as const
    })
    .show(player)
}
