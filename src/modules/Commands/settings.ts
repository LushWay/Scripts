import { playerSettingsMenu, worldSettingsMenu } from 'lib/Settings'

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('settings')
  .setAliases('options', 's')
  .setPermissions('member')
  .setDescription('Настройки')
  .executes(ctx => {
    // @ts-expect-error TS(2554) FIXME: Expected 2 arguments, but got 1.
    playerSettingsMenu(ctx.player)
  })

// @ts-expect-error TS(2304) FIXME: Cannot find name 'Command'.
new Command('wsettings')
  .setPermissions('techAdmin')
  .setDescription('Настройки мира')
  .executes(ctx => {
    worldSettingsMenu(ctx.player)
  })
