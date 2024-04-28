import { TicksPerSecond, system } from '@minecraft/server'

const interval = 20
const time = TicksPerSecond * interval
system.runPlayerInterval(
  player => {
    player.scores.lastSeenDate = ~~(Date.now() / 1000)
    player.scores.totalOnlineTime += time
    if (player.database.inv === 'anarchy') player.scores.anarchyOnlineTime += time
  },
  'player stats',
  interval,
)
