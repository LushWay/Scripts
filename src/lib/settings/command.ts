import { i18n } from 'lib/i18n/text'
import { playerSettingsMenu, worldSettingsMenu } from 'lib/settings'

new Command('settings')
  .setAliases('options')
  .setPermissions('member')
  .setDescription(i18n`Настройки`)
  .executes(ctx => {
    playerSettingsMenu(ctx.player)
  })

new Command('wsettings')
  .setPermissions('techAdmin')
  .setDescription(i18n`Настройки мира`)
  .executes(ctx => {
    worldSettingsMenu(ctx.player)
  })
