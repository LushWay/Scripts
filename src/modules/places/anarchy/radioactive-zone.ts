import { EntityDamageCause, Player, system, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { Vector } from 'lib/vector'
import { request } from '../../../lib/bds/api'

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

          const distance = Vector.distance(p.location, center)
          if (distance > rad) {
            // Radioactive sound
            p.addEffect(MinecraftEffectTypes.Nausea, 2 * TicksPerSecond, { showParticles: false, amplifier: 1 })
          }

          if (distance > rad + 20) {
            // Most radioactive sound
            p.applyDamage(2, { cause: EntityDamageCause.magic })
            p.addEffect(MinecraftEffectTypes.Darkness, 2 * TicksPerSecond, { amplifier: 255, showParticles: false })
          }
        }
      },
      'radioactive zone',
      20,
    )
  }
}

let reloadSent = false
