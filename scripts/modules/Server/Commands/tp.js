import { ActionForm } from 'smapi.js'

new Command({
  name: 'tp',
  role: 'builder',
  description: 'Открывает меню телепортации',
}).executes(ctx => {
  const form = new ActionForm('Выберите локацию')

  const locations = {
    'Деревня шахтеров': '139 71 13460 140 -10',
    'Деревня исследователей': '-26 65 13778 180 10',
    'Каменоломня': '-1300 76 14800 -90 5',
    'Техноград': '-1288 64 13626 90 -10',
  }

  for (const [name, location] of Object.entries(locations)) {
    form.addButton(name, () => ctx.sender.runCommand('tp ' + location))
  }

  form.show(ctx.sender)
})
