import { TicksPerDay, system, world } from '@minecraft/server'
import { Settings } from 'lib'

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

const settings = Settings.world('server', {
  syncRealTime: {
    name: 'Синхронизировать время',
    description: 'Синхронизировать время в майнкрафте с реальным',
    value: true,
  },
})

system.runInterval(
  function syncRealTime() {
    if (settings.syncRealTime) world.setTimeOfDay(realTimeToMinecraftTicks())
  },
  'syncRealTime',
  // One minute
  5,
)
