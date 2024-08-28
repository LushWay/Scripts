import { ItemStack } from '@minecraft/server'
import { ArrayForm } from 'lib'

export const customItems: ItemStack[] = []

new Command('getitem')
  .setPermissions('techAdmin')
  .setDescription('Получает кастомный предмет')
  .executes(ctx => {
    new ArrayForm('GetItem', customItems)
      .button(item => {
        return [
          `${item.nameTag ?? item.typeId}\n${item.getLore().join(' ')}`,
          () => ctx.player.container?.addItem(item),
        ]
      })
      .show(ctx.player)
  })
