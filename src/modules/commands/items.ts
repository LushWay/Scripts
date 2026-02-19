import { langToken } from 'lib/i18n/lang'
import { translateToken } from 'lib/i18n/lang'
import { ArrayForm } from 'lib/form/array'
import { noI18n } from 'lib/i18n/text'
import { customItems } from 'lib/rpg/custom-item'

new Command('items')
  .setPermissions('techAdmin')
  .setDescription(noI18n`Получает кастомный предмет`)
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
