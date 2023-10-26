import { ActionForm, Database, InventoryStore } from 'xapi.js'

/**
 * @type {Database<string, {invs?: Record<string, string>}>}
 */
const DB = new Database('player', {
  defaultValue() {
    return {
      invs: {},
    }
  },
})

const STORE = new InventoryStore('inventories')

new XCommand({
  name: 'inv',
  role: 'moderator',
  description: 'Управляет сохраненными инвентарями',
}).executes(ctx => {
  const inventories = DB.get(ctx.sender.id).invs ?? {}
  const form = new ActionForm(
    'Inventories',
    'Выбери слот для выгрузки:'
  ).addButton('Новый', null, () => {})

  for (const [key, value] of Object.entries(inventories)) {
    const inv = STORE.getEntityStore(key, false)
    let label = key
    label += ' '
    if (Object.keys(inv.equipment).length) label += XA.Lang.emoji.armor
    if (inv.slots.length) label += `(${inv.slots.length})`
    form.addButton(label, null, () => {})
  }

  form.show(ctx.sender)
})
