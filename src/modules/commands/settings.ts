import { playerSettingsMenu, worldSettingsMenu } from 'lib/settings'
import { t } from 'lib/text'

new Command('settings')
  .setAliases('options')
  .setPermissions('member')
  .setDescription(t`Настройки`)
  .executes(ctx => {
    playerSettingsMenu(ctx.player)
  })

new Command('wsettings')
  .setPermissions('techAdmin')
  .setDescription(t`Настройки мира`)
  .executes(ctx => {
    worldSettingsMenu(ctx.player)
  })
