import { restorePlayerCamera } from 'lib'
import { i18n } from 'lib/i18n/text'

new Command('camera').setDescription(i18n`Возвращает камеру в исходное состояние`).executes(ctx => {
  restorePlayerCamera(ctx.player, 1)
})
