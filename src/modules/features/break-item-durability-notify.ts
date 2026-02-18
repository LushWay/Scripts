import { system } from '@minecraft/server'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'
import { i18n } from 'lib/i18n/text'
import { actionGuard, ActionGuardOrder } from 'lib/region'
import { Menu } from 'lib/rpg/menu'
import { Settings } from 'lib/settings'

const playerSettings = Settings.player(...Menu.settings, {
  breakItemDurabilityNotify: {
    name: i18n`Уведомлять о ломающемся предмете`,
    description: i18n`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 90%% прочности, показывать уведомление на весь экран`,
    value: true,
  },
  breakItemDurabilityCancel: {
    name: i18n`Не давать ломать предмет`,
    description: i18n`Если включено, то когда вы взаимодействуете с блоком предметом, у которого остается менее 99%% прочности, взаимодействие будет отменено, а предмет - спасен.`,
    value: true,
  },
})

actionGuard((player, _, ctx) => {
  if (ctx.type !== 'break') return

  const durability = ctx.event.itemStack?.durability
  if (!durability) return

  const { damage, maxDurability } = durability
  const percent = 100 - (damage / maxDurability) * 100

  const settings = playerSettings(player)
  if (percent < 10 && settings.breakItemDurabilityNotify)
    system.delay(() => {
      player.onScreenDisplay.setActionBar(
        i18n.error`Инструмент скоро сломается! ${maxDurability - damage}/${maxDurability} (${percent}%)`.to(
          player.lang,
        ),
        ActionbarPriority.Highest,
      )
    })

  if (settings.breakItemDurabilityCancel && damage + 1 >= maxDurability) {
    return false
  }
}, ActionGuardOrder.Feature)

export const breakItemDurabilityNotify = {
  playerSettings,
}
