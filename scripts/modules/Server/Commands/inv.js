import { emoji } from 'lib/List/emoji.js'
import { ActionForm, InventoryStore } from 'smapi.js'

const STORE = new InventoryStore('inventories')

new Command({
  name: 'inv',
  role: 'moderator',
  description: 'Управляет сохраненными инвентарями',
}).executes(ctx => {
  ctx.sender.database.server ??= {
    invs: {},
  }
  const inventories = ctx.sender.database.server?.invs
  const form = new ActionForm(
    'Inventories',
    'Выбери слот для выгрузки:'
  ).addButton('Новый', null, () => {})

  for (const [key, value] of Object.entries(inventories)) {
    const inv = STORE.getEntityStore(key, false)
    let label = key
    label += ' '
    if (Object.keys(inv.equipment).length) label += emoji.armor
    if (inv.slots.length) label += ` (${inv.slots.length})`
    form.addButton(label, null, () => {})
  }

  form.show(ctx.sender)
})
