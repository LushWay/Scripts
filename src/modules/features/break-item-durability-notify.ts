import { system } from '@minecraft/server'
import { actionGuard, ActionGuardOrder, Menu, Settings } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'

const playerSettings = Settings.player(...Menu.settings, {
  breakItemDurabilityNotify: {
    name: i18n`Уведомлять о ломающемся предмете`,
    description: i18n`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 90%% прочности, показывать уведомление на весь экран`,
    value: true,
  },
  // TODO Donut feature
  breakItemDurabilityCancel: {
    name: i18n`Не давать ломать предмет`,
    description: i18n`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 99%% прочности, взаимодействие будет отменено, а предмет - спасен.`,
    value: true,
  },
})

actionGuard((player, _, ctx) => {
  const settings = playerSettings(player)
  if (!settings.breakItemDurabilityNotify) return
  if (ctx.type !== 'break') return

  const durability = ctx.event.itemStack?.durability
  if (!durability) return

  const { damage, maxDurability } = durability

  const percent = (damage / maxDurability) * 100

  if (percent >= 90)
    system.delay(() => {
      player.onScreenDisplay.setActionBar(
        i18n.error`Инструмент скоро сломается! ${damage}/${maxDurability} (${percent}%)`.to(player.lang),
        ActionbarPriority.Highest,
      )
    })

  if (settings.breakItemDurabilityCancel && damage + 1 >= maxDurability) {
    return false
  }
}, ActionGuardOrder.Feature)
