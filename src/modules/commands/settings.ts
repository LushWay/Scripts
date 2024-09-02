import { playerSettingsMenu, worldSettingsMenu } from 'lib/settings'

new Command('settings')
  .setAliases('options')
  .setPermissions('member')
  .setDescription('Настройки')
  .executes(ctx => {
    playerSettingsMenu(ctx.player)
  })

new Command('wsettings')
  .setPermissions('techAdmin')
  .setDescription('Настройки мира')
  .executes(ctx => {
    worldSettingsMenu(ctx.player)
  })
