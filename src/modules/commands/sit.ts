import { system, world } from '@minecraft/server'
import { LockAction } from 'lib'
import { CustomEntityTypes } from 'lib/assets/custom-entity-types'
import { ActionbarPriority } from 'lib/extensions/on-screen-display'

new Command('sit')
  .setDescription('Присаживает вас')
  .setGroup('public')
  .setPermissions('member')
  .executes(ctx => {
    if (ctx.player.getVelocity().y !== 0) return ctx.error('Вы не можете сесть в падении!')
    if (LockAction.locked(ctx.player)) return
    const entity = ctx.player.dimension.spawnEntity(CustomEntityTypes.Sit, ctx.player.location)
    ctx.player.closeChat()
    // Rideable component doesnt works
    entity.runCommand('ride @p start_riding @s teleport_rider ')
    entity.setRotation(ctx.player.getRotation())

    system.delay(() => {
      ctx.player.onScreenDisplay.setActionBar(
        '§3> §fВы сели. Чтобы встать, крадитесь',
        ActionbarPriority.UrgentNotificiation,
      )
    })
  })

system.runInterval(
  () => {
    for (const e of world.overworld.getEntities({
      type: CustomEntityTypes.Sit,
    })) {
      const players = e.dimension.getEntities({
        type: 'minecraft:player',
        location: e.location,
        maxDistance: 2,
      })

      if (players.length < 1) e.remove()
    }
  },
  'sit entity clear',
  40,
)
