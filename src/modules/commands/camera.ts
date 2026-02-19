import { i18n } from 'lib/i18n/text'
import { restorePlayerCamera } from 'lib/utils/game'

new Command('camera').setDescription(i18n`Возвращает камеру в исходное состояние`).executes(ctx => {
  restorePlayerCamera(ctx.player, 1)
})
