import { Player } from '@minecraft/server'
import { ActionForm } from 'smapi.js'

new Command({
  name: 'tp',
  role: 'member', // TODO! on release change role to builder
  description: 'Открывает меню телепортации',
}).executes(ctx => {
  tpMenu(ctx.sender)
})

/**
 * @param {Player} player
 */
export function tpMenu(player) {
  const form = new ActionForm('Выберите локацию')

  const locations = {
    'Деревня шахтеров': '136 71 13457 140 -10',
    'Деревня исследователей': '20 30 13778 180 10',
    'Каменоломня': '-1300 76 14800 -90 5',
    'Техноград': '-1288 64 13626 90 -10',
  }

  for (const [name, location] of Object.entries(locations)) {
    form.addButton(name, () => player.runCommand('tp ' + location))
  }

  form.show(player)
}
