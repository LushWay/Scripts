import { EntityDamageCause, Player, system, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { request } from 'lib/bds/api'
import { t } from 'lib/text'
import { Vector } from 'lib/vector'

export class RadioactiveZone {
  lastRadius = 0

  constructor(
    readonly center: Vector3,
    readonly radius: (players: Player[]) => number,
  ) {
    system.runInterval(
      () => {
        const players = world.getAllPlayers()
        this.lastRadius = typeof this.radius === 'function' ? this.radius(players) : this.radius
        const rad = this.lastRadius
        const center = this.center

        for (const p of players) {
          if (typeof p === 'undefined') {
            if (!reloadSent) request('reload', { reason: 'Player is undefined' })
            reloadSent = true
            return
          }

          if (p.database.inv !== 'anarchy') continue

          const distance = Vector.distance(p.location, center)
          if (distance > rad) {
            // Radioactive sound
            p.onScreenDisplay.setActionBar(t.warn`Высокая радиация!`)
            p.addEffect(MinecraftEffectTypes.Poison, 10 * TicksPerSecond, { showParticles: true, amplifier: 1 })
          }

          if (distance > rad + 20) {
            // Most radioactive sound
            p.onScreenDisplay.setActionBar(t.error`Очень высокая радиация!`)
            p.applyDamage(2, { cause: EntityDamageCause.magic })
            p.addEffect(MinecraftEffectTypes.Darkness, 10 * TicksPerSecond, { showParticles: true, amplifier: 255 })
          }
        }
      },
      'radioactive zone',
      20,
    )
  }
}

let reloadSent = false
