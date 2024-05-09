import { playerSettingsMenu, worldSettingsMenu } from 'lib/Settings'


new Command('settings')
  .setAliases('options', 's')
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
