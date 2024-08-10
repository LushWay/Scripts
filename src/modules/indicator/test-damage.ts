import { Player } from '@minecraft/server'
import { registerAsync } from '@minecraft/server-gametest'
import { Temporary } from 'lib'
import { t } from 'lib/text'
import { TestStructures } from 'test/constants'

registerAsync('test', 'damage', async test => {
  const player = test.spawnSimulatedPlayer({ x: 0, y: 1, z: 0 })

  new Temporary(({ world }) => {
    world.afterEvents.entityDie.subscribe(event => {
      if (event.deadEntity.id === player.id) {
        player.respawn()
      }
    })

    world.afterEvents.playerSpawn.subscribe(event => {
      if (event.player.id === player.id) {
        player.runCommand('tp @s @p[rm=1,c=1]')
      }
    })

    world.afterEvents.entityHurt.subscribe(event => {
      if (event.hurtEntity.id === player.id) {
        if (event.damageSource.damagingEntity instanceof Player) {
          const hp = event.hurtEntity.getComponent('health')?.currentValue ?? 0
          event.damageSource.damagingEntity.onScreenDisplay.setActionBar(
            t`Damage: ${event.damage.toFixed(2)}, HP: ${hp.toFixed(2)}`,
          )
        }
      }
    })

    world.beforeEvents.playerInteractWithEntity.subscribe(event => {
      if (event.target.id === player.id) {
      }
    })
  })

  await test.idle(1000)
})
  .maxTicks(999999)
  .structureName(TestStructures.empty)
