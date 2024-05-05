import { system, world } from '@minecraft/server'
import { LockAction } from 'lib.js'
import { CUSTOM_ENTITIES } from 'lib/Assets/config'

new Command('sit')
  .setDescription('Присаживает вас')
  .setGroup('public')
  .setPermissions('member')
  .executes(async ctx => {
    if (ctx.player.getVelocity().y !== 0) return ctx.error('Вы не можете сесть в падении!')
    if (LockAction.locked(ctx.player)) return
    const entity = ctx.player.dimension.spawnEntity(CUSTOM_ENTITIES.sit, ctx.player.location)
    ctx.player.closeChat()
    // Rideable component doesnt works
    entity.runCommand('ride @p start_riding @s teleport_rider ')
    entity.setRotation(ctx.player.getRotation())

    await nextTick
    ctx.player.onScreenDisplay.setActionBar('§3> §fВы сели. Чтобы встать, крадитесь')
  })

system.runInterval(
  () => {
    for (const e of world.overworld.getEntities({
      type: CUSTOM_ENTITIES.sit,
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
