import { system } from '@minecraft/server'
import { actionGuard, ActionGuardOrder, Menu, Settings } from 'lib'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { t } from 'lib/text'

const playerSettings = Settings.player(...Menu.settings, {
  breakItemDurabilityNotify: {
    name: t`Уведомлять о ломающемся предмете`,
    description:
      t`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 90%% прочности, показывать уведомление на весь экран`,
    value: true,
  },
  // TODO Donut feature
  breakItemDurabilityCancel: {
    name: t`Не давать ломать предмет`,
    description:
      t`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 99%% прочности, взаимодействие будет отменено, а предмет - спасен.`,
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

  if (settings.breakItemDurabilityCancel && percent >= 99) return false

  system.delay(() => {
    if (percent >= 90)
      player.onScreenDisplay.setActionBar(
        t.error`§cИнструмент скоро сломается! ${damage}/${maxDurability} (${percent}%)`,
        ActionbarPriority.Highest,
      )
  })
}, ActionGuardOrder.Feature)
