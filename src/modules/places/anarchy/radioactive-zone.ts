import { EntityDamageCause, Player, system, TicksPerSecond, world } from '@minecraft/server'
import { MinecraftEffectTypes } from '@minecraft/vanilla-data'
import { Sounds } from 'lib/assets/custom-sounds'
import { request } from 'lib/bds/api'
import { t } from 'lib/text'
import { Vector } from 'lib/vector'

export class RadioactiveZone {
  lastRadius = 0

  constructor(
    readonly center: Vector3,
    readonly radius: (players: Player[]) => number,
  ) {
    let i = 0
    system.runInterval(
      () => {
        const players = world.getAllPlayers()
        this.lastRadius = typeof this.radius === 'function' ? this.radius(players) : this.radius
        const rad = this.lastRadius
        const center = this.center
        i++
        if (i >= 3) i = 0
        const soundTick = i === 0

        for (const p of players) {
          if (typeof p === 'undefined') {
            if (!reloadSent) request('reload', { reason: 'Player is undefined' })
            reloadSent = true
            return
          }

          if (p.database.inv !== 'anarchy') continue

          const distance = Vector.distance(p.location, center)
          let played = false
          const sound = (volume: number, num = 1) => {
            if (!played && soundTick) {
              p.runCommand('stopsound @s ' + Sounds['lw.radiation'])
              for (let i = 0; i < num; i++) p.playSound(Sounds['lw.radiation'], { volume, pitch: i * 0.5 + 1 })
            }
            played = true
          }

          if (distance > rad - 20) {
            sound(0.5)
          }

          if (distance > rad) {
            sound(2, 2)
            p.onScreenDisplay.setActionBar(t.warn`Высокая радиация!`)
            p.addEffect(MinecraftEffectTypes.Poison, 10 * TicksPerSecond, { showParticles: true, amplifier: 1 })
          }

          if (distance > rad + 20) {
            sound(4, 4)
            p.onScreenDisplay.setActionBar(t.error`Очень высокая радиация!`)
            p.applyDamage(2, { cause: EntityDamageCause.magic })
            if (!p.getEffects().find(e => e.typeId === MinecraftEffectTypes.Darkness))
              p.addEffect(MinecraftEffectTypes.Darkness, 10 * TicksPerSecond, { showParticles: true, amplifier: 255 })
          }

          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!played) p.runCommand('stopsound @s ' + Sounds['lw.radiation'])
        }
      },
      'radioactive zone',
      20,
    )
  }
}

let reloadSent = false
