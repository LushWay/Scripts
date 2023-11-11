import { ItemStack, ItemTypes } from '@minecraft/server'
import { ActionForm, EventSignal } from 'xapi.js'
import { JOIN, shortTime, timeNow } from './var.js'

JOIN.EVENT_DEFAULTS.join = JOIN.EVENTS.join.subscribe(player => {
  player.tell(`${timeNow()}, ${player.name}!\n§r§3Время §b• §3${shortTime()}`)
}, -1)
JOIN.EVENT_DEFAULTS.firstTime = JOIN.EVENTS.firstTime.subscribe(player => {
  new ActionForm(
    'Краткий гайд',
    `  ${timeNow()}, ${
      player.name
    }!\n  §7Основные функции сервера находятся в §fменю§7 - зачарованном алмазе в инвентаре.§7 Чтобы открыть меню, возьми его в руку и §fиспользуй§7 его - зажми на телефоне, ПКМ на пк\n\n  §7Что бы просмотреть доступные кастомные команды напиши в чат '§f-help§7'.\n\n\n `
  )
    .addButton('Oк!', null, () =>
      EventSignal.emit(JOIN.EVENTS.playerClosedGuide, player)
    )
    .show(player)
}, -1)
JOIN.EVENT_DEFAULTS.playerClosedGuide = JOIN.EVENTS.playerClosedGuide.subscribe(
  p => {
    const menu = ItemTypes.get('xa:menu')
    if (!menu) throw new TypeError("ItemType 'xa:menu' does not exists.")
    p.getComponent('inventory').container.addItem(new ItemStack(menu))
  }
)
