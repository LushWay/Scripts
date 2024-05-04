import { playerSettingsMenu, worldSettingsMenu } from 'lib/Settings'

new Command({
  name: 'settings',
  aliases: ['options', 's'],
  role: 'member',
  description: 'Настройки',
}).executes(ctx => {
  playerSettingsMenu(ctx.sender)
})

new Command({
  name: 'wsettings',
  role: 'techAdmin',
  description: 'Настройки мира',
}).executes(ctx => {
  worldSettingsMenu(ctx.sender)
})
