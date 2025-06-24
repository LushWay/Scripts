import { restorePlayerCamera } from 'lib'
import { t } from 'lib/i18n/text'

new Command('camera').setDescription(t`Возвращает камеру в исходное состояние`).executes(ctx => {
  restorePlayerCamera(ctx.player, 1)
})
