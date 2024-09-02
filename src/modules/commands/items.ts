import { ItemStack } from '@minecraft/server'
import { ArrayForm, langToken, translateToken } from 'lib'

export const customItems: ItemStack[] = []

new Command('items')
  .setPermissions('techAdmin')
  .setDescription('Получает кастомный предмет')
  .executes(ctx => {
    new ArrayForm('Items', customItems)
      .button(item => {
        return [
          `${item.nameTag ?? translateToken(ctx.player.lang, langToken(item.typeId))}\n${item.getLore().join('')}`,
          () => ctx.player.container?.addItem(item),
        ]
      })
      .show(ctx.player)
  })
