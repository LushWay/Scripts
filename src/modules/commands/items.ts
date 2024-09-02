import { ItemStack } from '@minecraft/server'
import { ArrayForm, langToken } from 'lib'

export const customItems: ItemStack[] = []

new Command('items')
  .setPermissions('techAdmin')
  .setDescription('Получает кастомный предмет')
  .executes(ctx => {
    new ArrayForm('Items', customItems)
      .button(item => {
        return [
          `${item.nameTag ?? `%${langToken(item.typeId)}`}\n${item.getLore().join('')}`,
          () => ctx.player.container?.addItem(item),
        ]
      })
      .show(ctx.player)
  })
