import { Vector } from '@minecraft/server'
import { WorldEditBuild } from '../../builders/WorldEditBuilder.js'

new XCommand({
  name: 'pos1',
  aliases: ['p1'],
  description: 'Set position 1',
  role: 'moderator',
})
  .location('pos', true)
  .executes((ctx, pos) => {
    pos = Vector.floor(pos)
    WorldEditBuild.pos1 = pos
    ctx.reply(`§5►§r (1) ${pos.x}, ${pos.y}, ${pos.z}`)
  })
