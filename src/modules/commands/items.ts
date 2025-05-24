import { ArrayForm, langToken, translateToken } from 'lib'
import { customItems } from 'lib/rpg/custom-item'

new Command('items')
  .setPermissions('techAdmin')
  .setDescription('Получает кастомный предмет')
  .executes(ctx => {
    new ArrayForm('Items', customItems)
      .button(item => {
        return [
          `${item.nameTag ?? translateToken(langToken(item.typeId) ?? '', ctx.player.lang)}\n${item.getLore().join('')}`,
          () => ctx.player.container?.addItem(item),
        ]
      })
      .show(ctx.player)
  })
