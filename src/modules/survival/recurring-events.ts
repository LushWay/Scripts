import { TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes, MinecraftEffectTypesUnion } from '@minecraft/vanilla-data'
import { ms } from 'lib'
import { DurationalRecurringEvent } from 'lib/recurring-event'
import later from 'lib/utils/later'

// TODO Add settings for players to not apply effects on them
// TODO Add command to show menu to view events
// TODO Add a way to trigger event right now in the menu by using leafs (should be separated from the regular ones and with the bigger amplifier, and regular ones should not intersect with custom ones)
// TODO Add menu to the survival menu
// TODO Add chat notification

for (const { effectType, startingOn } of [
  { effectType: 'Haste', startingOn: 1 },
  { effectType: 'HealthBoost', startingOn: 4 },
] satisfies {
  effectType: MinecraftEffectTypesUnion
  startingOn: number
}[]) {
  new DurationalRecurringEvent(
    `effect${effectType}`,
    later.parse.recur().every(5).hour().startingOn(startingOn),
    ms.from('min', 10),
    () => ({}),
    (_, ctx) => {
      ctx.temp.system.runInterval(
        () => {
          for (const player of world.getAllPlayers())
            player.addEffect(MinecraftEffectTypes[effectType], TicksPerSecond * 3, {
              amplifier: 2,
              showParticles: false,
            })
        },
        `effect${effectType}`,
        TicksPerSecond * 2,
      )
    },
  )
}
