import { TicksPerDay, TimeOfDay, system, world } from '@minecraft/server'
import { Settings } from 'lib'
import { noI18n } from 'lib/i18n/text'

const MinutesPerDay = 24 * 60
const Offset = 6000

function realTimeToMinecraftTicks(date = new Date()) {
  // Get total minutes
  const minutes = date.getMinutes() + date.getHours() * 60

  // min / minPerDay = ticks / TicksPerDay
  const ticks = (minutes / MinutesPerDay) * TicksPerDay

  // minecraft 0 tick = 6:00, so add an offset
  const result = ticks >= Offset ? ticks - Offset : TicksPerDay - 1 - Offset + ticks

  return result
}

const settings = Settings.world(...Settings.worldCommon, {
  syncRealTime: {
    name: 'Синхронизировать время',
    description: 'Синхронизировать время в майнкрафте с реальным',
    value: true,
    onChange() {
      if (settings.syncRealTime) {
        world.say(noI18n`§7Теперь время игры синхронизируется с реальным`)
        sync()
      } else {
        world.say(noI18n`§7Время игры больше не синхронизируется с реальным`)
        system.clearRun(id)
        world.setTimeOfDay(TimeOfDay.Day)
      }
    },
  },
})

let id = 0
function sync() {
  id = system.runInterval(
    function syncRealTime() {
      world.setTimeOfDay(realTimeToMinecraftTicks())
    },
    'syncRealTime',
    5,
  )
}
