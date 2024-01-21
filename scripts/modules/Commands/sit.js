import { system, world } from '@minecraft/server'
import { CUSTOM_ENTITIES } from 'config'
import { LockAction } from 'smapi.js'

new Command({
  name: 'sit',
  description: 'Присаживает вас',
  type: 'public',
  role: 'member',
}).executes(async ctx => {
  if (LockAction.locked(ctx.sender)) return
  const entity = ctx.sender.dimension.spawnEntity(CUSTOM_ENTITIES.sit, ctx.sender.location)
  ctx.sender.closeChat()
  // Rideable component doesnt works
  entity.runCommand('ride @p start_riding @s teleport_rider ')

  await nextTick
  ctx.sender.onScreenDisplay.setActionBar('§3> §fВы сели. Чтобы встать, крадитесь')
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
  40
)
